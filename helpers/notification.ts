import { NotificationData } from "../api/v1/interfaces/notification.interface";
import Employer from "../models/employers.model";
import Notification from "../models/notifications.model";
import { sendSingleMessage } from "./firebaseMessage";

export enum ENUM_NOTIFICATION_TYPE {
  CV = "cv",
}

export enum ENUM_NOTIFICATION_DETAIL_TYPE {
  NEW_CV = "new_cv",
}

const formatData = (params) => {
  const data: NotificationData = {
    ...params,
    content: params?.content || "",
    title: params?.title || "",
    image: params?.image || "",
    is_seen: params?.is_seen || false,
  };

  switch (params.type) {
    case ENUM_NOTIFICATION_TYPE.CV:
      switch (params.detail_type) {
        case ENUM_NOTIFICATION_DETAIL_TYPE.NEW_CV:
          data.title = "Bạn có đơn ứng tuyển mới";
          data.content = `${data?.extra?.candidate_name} đã ứng tuyển vào chiến dịch ${data?.extra?.job_title} của bạn`;
          break;
      }
      break;
    default:
      break;
  }

  return data;
};

export const createAndSendNotification = async (params) => {
  const data = formatData(params);
  const record = new Notification(data);
  await record.save();

  const messageData: any = {
    title: data.title,
    body: data.content,
  };

  if (data?.employerId) {
    const employer = await Employer.findById(data.employerId);
    await sendSingleMessage(employer?.notification_token[0], messageData);
  }
};
