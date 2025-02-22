import { motion } from "framer-motion";
import { forwardRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { Presence } from '../types/lanyard';
import SpotifyLogo from '../assets/images/spotify-logo.svg';

// Thanks to Tim (https://github.com/timcole/timcole.me/blob/%F0%9F%A6%84/components/lanyard.tsx) for the types

enum Operation {
  Event,
  Hello,
  Initialize,
  Heartbeat,
}

enum EventType {
  INIT_STATE = 'INIT_STATE',
  PRESENCE_UPDATE = 'PRESENCE_UPDATE',
}

type SocketEvent = {
  op: Operation;
  t?: EventType;
  d: Presence | unknown;
};

const logLanyardEvent = (eventName: string, data: any) => {
  // eslint-disable-next-line no-console
  console.log(
    `%cLanyard%c <~ ${eventName} %o`,
    'background-color: #d7bb87; border-radius: 5px; padding: 3px; color: #372910;',
    'background: none; color: #d7bb87;',
    data
  );
};

const discordId = "94490510688792576";

const Doing = ({setActive, ...props}: {setActive: (active: boolean) => void} & any, ref: any) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [doing, setDoing] = useState<Presence>();
  
  const send = (op: Operation, d?: unknown): void => {
    if (socket !== null) socket.send(JSON.stringify({ op, d }));
  };

  useEffect(() => {
    if (socket === null) return () => {};
    socket.onmessage = function ({ data }: MessageEvent): void {
      const { op, t, d }: SocketEvent = JSON.parse(data);

      if (op === Operation.Hello) {
        setInterval(() => send(Operation.Heartbeat), (d as { heartbeat_interval: number }).heartbeat_interval);
        send(Operation.Initialize, { subscribe_to_id: discordId });
      } else if (op === Operation.Event && t) {
        logLanyardEvent(t, d);

        if ([EventType.INIT_STATE, EventType.PRESENCE_UPDATE].includes(t)) setDoing(d as Presence);
        setActive((d as Presence).listening_to_spotify)
      }
    };
  }, [socket]);

  useEffect(() => {
    if (socket !== null) return () => {};
    setSocket(new WebSocket("wss://api.lanyard.rest/socket"));
  }, []);

  if(!doing || !doing.listening_to_spotify) return null;

  return (
    <Container ref={ref} to={"/presence"} {...props}>
      <h5>Listening to Spotify <LiveDot/></h5>
      {doing?.listening_to_spotify ? <>
      <ActivityRow>
        <ActivityImageContainer>
          <ActivityImage src={doing.spotify.album_art_url} />
          <ActivitySecondaryImage src={SpotifyLogo}/>
        </ActivityImageContainer>

        <ActivityInfo>
          <h5>{doing.spotify.song}</h5>
          <p>by {doing.spotify.artist}</p>
        </ActivityInfo>
      </ActivityRow>
      {/* <Progress percentage={doing.spotify.timestamps.end}/> */}
      </> : null}
    </Container>
  )
}

const Container = styled(motion(Link))`
  width: calc(100% + 2rem);
  margin-left: -2rem;
  background-color: transparent;
  color: #ccc;
  border-top: 1px solid #101010;
  padding: 1rem;
  cursor: pointer;

  &:hover {
    background-color: #101010;
    color: #fff;
  }

  h5 {
    margin: 0;
    margin-bottom: 10px;
  }
`;

const fadeInOut = keyframes`
  0% {
    opacity: 0;
  }
  
  50% {
    opacity: 1;
  }

  100% {
    opacity: 0%;
  }
`;


const LiveDot = styled.div`
  display: inline-block;
  margin-left: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ff5252;
  animation: ${fadeInOut} 2s ease-in-out infinite;
`;

const ActivityRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const ActivityImageContainer = styled.div`
  position: relative;
  height: 50px;
`;

const ActivityImage = styled.img`
  height: 50px;
  width: 50px;
  border-radius: 10px;
`;

const ActivitySecondaryImage = styled.img`
  position: absolute;
  bottom: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #000;
  border: 2px solid #000;
`;

const ActivityInfo = styled.div`
  margin-left: 1rem;

  h5 {
    color: #fff;
    margin: 0;
  }

  p {
    margin: 0;
    font-size: 0.8rem;
  }
`;

export default forwardRef(Doing);