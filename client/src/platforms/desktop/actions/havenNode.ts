import {getHavendStateIPC} from "../ipc/misc";
import {
  GET_HAVEND_STATE_FAILED,
  GET_HAVEND_STATE_SUCCEED,
  SET_HAVEN_NODE_FAILED,
  SET_HAVEN_NODE_SUCCESS
} from "./types";
import {NodeLocation} from "platforms/desktop/types";
import {setDaemonRPC} from "platforms/desktop/ipc/rpc/rpc";
import {addErrorNotification, addNotificationByMessage} from "shared/actions/notification";
import {NotificationType} from "constants/notificationList";
import {DesktopAppState} from "platforms/desktop/reducers";
import {HavendState} from "platforms/desktop/ipc/ipc-types";
import {getDaemonsState} from "platforms/desktop/actions/refresh";

export const gethavenNodeState = () => {
  return (dispatch: any) => {
    getHavendStateIPC()
      .then((res: HavendState) => {
        dispatch(updatehavenNodeState(res));
      })
      .catch((err) => dispatch(updatehavenNodeStateFailed(err)));
  };
};

const updatehavenNodeState = (havendState: HavendState) => {

  const url = new URL(havendState.address);
  const {host, port} = url;
  return { type: GET_HAVEND_STATE_SUCCEED, payload: {...havendState, address: host, port} };
};

const updatehavenNodeStateFailed = (err: any) => {
  return { type: GET_HAVEND_STATE_FAILED, payload: err };
};

export const setHavenNode = (address: string, port: string, location: NodeLocation) => {


  return (dispatch: any, getState:() => DesktopAppState) => {

    let newAdress = '';
    let newPort = '';
    let trusted = false;
    if (location !== NodeLocation.Local) {

      trusted = true;
      newPort = port;
      newAdress = address;

    }

    const params = {address: newAdress + newPort, trusted};

    setDaemonRPC(params)
        .then(dispatch(sethavenNodeSucceed(address, port, location)))
        .then(dispatch(getDaemonsState()))
        .catch((error) => dispatch(sethavenNodeFailed(error)));
  }

};


const sethavenNodeSucceed = (address: string, port: string, location: NodeLocation) => {

  return (dispatch: any) => {

    dispatch({type: SET_HAVEN_NODE_SUCCESS, payload:{address, port, location}});
    dispatch(addNotificationByMessage( NotificationType.SUCCESS, "Good job, you switched you daemon"));

  }
};


const sethavenNodeFailed = (error: any) => {


  return (dispatch: any) => {

    dispatch({type: SET_HAVEN_NODE_FAILED});
    dispatch(addErrorNotification(error));

  }

};