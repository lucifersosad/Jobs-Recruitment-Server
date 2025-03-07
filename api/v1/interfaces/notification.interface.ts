import { ObjectId } from "mongoose";
import {
  ENUM_NOTIFICATION_DETAIL_TYPE,
  ENUM_NOTIFICATION_TYPE,
} from "../../../helpers/notification";

export interface NotificationData {
  userId?: number | null;
  employerId?: number;
  title: string;
  image: string;
  content: string;
  type: ENUM_NOTIFICATION_TYPE;
  detail_type: ENUM_NOTIFICATION_DETAIL_TYPE;
  is_seen: boolean;
  ref_id?: string;
  extra?: any;
}

export interface NotificationParams
  extends Omit<NotificationData, "content" | "image" | "title" | "is_seen"> {
  content?: string;
  image?: string | null;
  title?: string;
  is_seen?: boolean;
}

export interface Find {
  _id?: any;
  title?: RegExp;
  description?: string;
  employerId?: string;
  job_categorie_id?: string;
  website?: string;
  level?: string;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: any;
  ageMin?: number;
  ageMax?: number;
  gender?: string;

  educationalLevel?: string;
  workExperience?: string;
  presentationLanguage?: string;
  status?: string;
  detailWorkExperience?: string;
  linkVideoAboutIntroducingJob?: string;
  welfare?: string;
  listTagSlug?: string[];
  phone?: string;
  email?: string;
  featured?: boolean;
  end_date?: any;
  listTagName?: string[];
  receiveEmail?: boolean;
  address?: {
    location: string;
    linkMap: string;
  };
  keyword?: RegExp;
  deleted?: boolean;
  city?: string[];
  $or?: any;
  slug?: any;
  is_seen?: boolean
}
