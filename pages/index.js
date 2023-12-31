import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

import { Button, Form, Grid, Header, Message, Radio, Segment } from 'semantic-ui-react';
import { useEffect, useState } from 'react';

export default function Home() {

  const [rmn, setRmn] = useState("");
  const [sid, setSid] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [theUser, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setError] = useState("");
  const [results, setResults] = useState([]);
  const [loginType, setLoginType] = useState("OTP");
  const [pwd, setPwd] = useState("");
  const [downloading, setDownloading] = useState(false);


  useEffect(() => {
    let tok = localStorage.getItem("token");
    let userd = localStorage.getItem("userDetails");
    if (tok !== undefined && userd !== undefined) {
      setToken(tok);
      setUser(JSON.parse(userd));
    }
  }, []);

  useEffect(() => {
    if (theUser !== null) {
      fetch('/api/shorten', {
        method: 'POST',
        body: window.location.origin + '/api/getM3u?sid=' + theUser.sid + '_' + theUser.acStatus[0] + '&id=' + theUser.id + '&sname=' + theUser.sName + '&tkn=' + token + '&ent=' + theUser.entitlements.map(x => x.pkgId).join('_')
      })
        .then(res => res.json())
        .then(data => {
          console.log(data[0].key);
          setResults(data[0].key)
          setLoading(false)
        })
        .catch(err => {
          console.error(err)
          setLoading(false)
        })
    }
    else
      setResults("");
  }, [theUser, token])

  const getOTP = () => {
    setLoading(true);
    fetch("/api/getOtp?rmn=" + rmn)
      .then(response => response.text())
      .then(result => {
        const res = JSON.parse(result);
        setLoading(false);
        console.log(res);
        if (res.message.toLowerCase().indexOf("otp") > -1 && res.message.toLowerCase().indexOf("successfully") > -1) {
          setOtpSent(true);
          setError("");
        }
        else
          setError(res.message);
      })
      .catch(error => {
        console.log('error', error);
        setError(error.toString());
      });
  }

  const authenticateUser = () => {
    setLoading(true);
    fetch("/api/getAuthToken?sid=" + sid + "&loginType=" + loginType + "&otp=" + otp + "&pwd=" + pwd + "&rmn=" + rmn)
      .then(response => response.text())
      .then(result => {
        const res = JSON.parse(result);
        console.log(res);
        if (res.code === 0) {
          let userDetails = res.data.userDetails;
          userDetails.id = res.data.userProfile.id;
          let token = res.data.accessToken;
          setUser(userDetails);
          setToken(token);
          localStorage.setItem("userDetails", JSON.stringify(userDetails));
          localStorage.setItem("token", token);
          setError("");
        }
        else {
          setError(res.message);
          setLoading(false);
        }
      })
      .catch(error => {
        console.log('error', error);
        setError(error.toString());
        setLoading(false);
      });
  }

  const logout = () => {
    localStorage.clear();
    setRmn("");
    setSid("");
    setOtpSent(false);
    setOtp("");
    setPwd("");
    setUser(null);
    setToken("");
    setLoading(false);
  }

  function downloadM3uFile(filename) {
    setDownloading(true);
    const requestOptions = {
      method: 'GET',
      redirect: 'follow'
    };

    fetch(window.location.origin + '/api/getM3u?sid=' + theUser.sid + '_' + theUser.acStatus[0] + '&id=' + theUser.id + '&sname=' + theUser.sName + '&tkn=' + token + '&ent=' + theUser.entitlements.map(x => x.pkgId).join('_'), requestOptions)
      .then(response => response.text())
      .then(result => {
        console.log(result);
        const data = result;
        const blob = new Blob([data], { type: 'text/plain' });
        if (window.navigator.msSaveOrOpenBlob) {
          window.navigator.msSaveBlob(blob, filename);
        }
        else {
          const elem = window.document.createElement('a');
          elem.href = window.URL.createObjectURL(blob);
          elem.download = filename;
          document.body.appendChild(elem);
          elem.click();
          document.body.removeChild(elem);
        }
        setDownloading(false);
      })
      .catch(error => {
        console.log('error', error);
        setDownloading(false);
      });
  }

  return (
    <div>
      <Head>
        <title>Generate Tata Play IPTV playlist</title>
        <meta
          name="description"
          content="Easiest way to generate a Tata Play IPTV (m3u) playlist for the channels you have subscribed to."
        />
      </Head>
      {
        <Grid columns='equal' padded centered>
          {
            token === "" || theUser === null ?
              <Grid.Row>
                <Grid.Column></Grid.Column>
                <Grid.Column computer={8} tablet={12} mobile={16}>
                  <Segment loading={loading}>
                    <Header as={'h1'}>Generate Tata Play IPTV (m3u) playlist</Header>
                    <Form>
                      <Form.Group inline>
                        <label>Login via </label>
                        <Form.Field>
                          <Radio
                            label='OTP'
                            name='loginTypeRadio'
                            value='OTP'
                            checked={loginType === 'OTP'}
                            onChange={(e, { value }) => { setLoginType(value); }}
                          />
                        </Form.Field>
                      </Form.Group>

                      <>
                        <Form.Field disabled={otpSent}>
                          <label>RMN</label>
                          <input value={rmn} placeholder='Registered Mobile Number' onChange={(e) => setRmn(e.currentTarget.value)} />
                        </Form.Field>
                        <Form.Field disabled={otpSent}>
                          <label>Subscriber ID</label>
                          <input value={sid} placeholder='Subscriber ID' onChange={(e) => setSid(e.currentTarget.value)} />
                        </Form.Field>
                        <Form.Field disabled={!otpSent}>
                          <label>OTP</label>
                          <input value={otp} placeholder='OTP' onChange={(e) => setOtp(e.currentTarget.value)} />
                        </Form.Field>
                        {
                          otpSent ? <Button primary onClick={authenticateUser}>Login</Button> :
                            <Button primary onClick={getOTP}>Get OTP</Button>
                        }
                      </>

                    </Form>
                  </Segment>
                </Grid.Column>
                <Grid.Column></Grid.Column>
              </Grid.Row> :
              <Grid.Row>
                <Grid.Column></Grid.Column>
                <Grid.Column computer={8} tablet={12} mobile={16}>
                  <Segment loading={loading}>
                    <Header as="h1">Welcome, {theUser.sName}</Header>
                    {
                      theUser !== null ?
                        <Message>
                          <Message.Header>Dynamic URL to get m3u: </Message.Header>
                          {/* <Image centered src={'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' + encodeURIComponent(m3uMeta.url)} size='small' /> */}
                          <p>
                            <a href={`/${results}`}>{`${window.location.origin}`}/{`${results}`}</a>
                          </p>
                          <p>
                            You can use the above m3u URL in OTT Navigator or Tivimate app to watch all your subscribed channels.
                          </p>
                          <p>
                            The generated m3u URL is for permanent use and is not required to be refreshed every 24 hours. Enjoy!
                          </p>
                        </Message>
                        :
                        <Header as='h3' style={{ color: 'red' }}>Something went wrong. Please try again later.</Header>
                    }

                    <Button negative onClick={logout}>Logout</Button>
                  </Segment>
                </Grid.Column>
                <Grid.Column></Grid.Column>
              </Grid.Row>
          }
          <Grid.Row style={{ display: err === '' ? 'none' : 'block' }}>
            <Grid.Column></Grid.Column>
            <Grid.Column computer={8} tablet={12} mobile={16}>
              <Message color='red'>
                <Message.Header>Error</Message.Header>
                <p>
                  {err}
                </p>
              </Message>
            </Grid.Column>
            <Grid.Column></Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column></Grid.Column>
            <Grid.Column textAlign='center' computer={8} tablet={12} mobile={16}>
              <a href="https://github.com/shekhawat2/TataPlayList" target="_blank" rel="noreferrer">View source code on Github</a>
            </Grid.Column>
            <Grid.Column></Grid.Column>
          </Grid.Row>
        </Grid>
      }
    </div>
  )
}
