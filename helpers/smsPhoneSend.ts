import axios from "axios";
import ActivePhoneEmployer from "../models/active-phone-employer";

export const getSession = async (tokenSMS: string) => {
  try {
    const res = await axios({
      method: "get",
      url: "https://connect.speedsms.vn/speedsms/web/index.php/user/checkverify",
      headers: {
        Cookie: `_identity=${tokenSMS}`,
      },
    });
    return res;
  } catch (error) {
    // console.log("🚀 ~ getSession ~ error:", error);
  }
};

export const getSessionV2 = async (tokenSMS: string) => {
  try {
    const res = await axios({
      method: "post",
      url: "https://connect.speedsms.vn/speedsms/web/index.php/user/login",
      data: {
        userName: "luciferxhnh@gmail.com",
        password: "123456",
      },
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ getSession ~ error:", error);
  }
};

export const sendCode = async (session: string, phone: string) => {
  try {
    const res = await axios({
      method: "post",
      url: "https://widgetapiv1.tingting.im/api/pin",
      data: {
        session: session,
        default: "SMS",
        allows: "SMS,VOICE",
        to: phone,
        lang: "en",
        country: "auto",
        channel: "SMS",
      },
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ sendCode ~ error:", error);
  }
};

export const saveRecord = async (
  email: string,
  MSG_ID: string,
  session: string,
  phone: string
) => {
  const recordSave: any = {
    email: email,
    msg_id: MSG_ID,
    session: session,
    phone: phone,
    timeWait: new Date(),
    expireAt: new Date(new Date().getTime() + 60 * 1000),
  };
  return await ActivePhoneEmployer.create(recordSave);
};

export const verifyCode = async (
  phone: string,
  msg_id: string,
  code: string,
  session: string
) => {
  return await axios({
    method: "post",
    url: "https://widgetapiv1.tingting.im/api/verify",
    data: {
      to: phone,
      msg_id: msg_id,
      pin_code: code,
      session: session,
    },
  });
};
