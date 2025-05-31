export const S3_CORE = "https://s3-utem.s3.ap-southeast-2.amazonaws.com"

export const S3KeyFolder = {
  RESUME: "my-cvs"
}


export enum LevelEnum {
  STUDENT_INTERN = 'student-intern',
  JUST_HAVE_GRADUATED = 'just-have-graduated',
  STAFF = 'staff',
  TEAMLEADER_SUPERVISOR = 'teamleader-supervisor',
  MANAGE = 'manage',
  VICE_DIRECTOR = 'vice-director',
  GENERAL_MANAGER = 'general-manager',
}

export const LevelLabelMapping = {
  [LevelEnum.STUDENT_INTERN]: "Sinh Viên/Thực Tập Sinh",
  [LevelEnum.JUST_HAVE_GRADUATED]: "Mới Tốt Nghiệp",
  [LevelEnum.STAFF]: "Nhân Viên",
  [LevelEnum.TEAMLEADER_SUPERVISOR]: "Trưởng Nhóm/Giám Sát",
  [LevelEnum.MANAGE]: "Quản Lý",
  [LevelEnum.VICE_DIRECTOR]: "Phó Giám Đốc",
  [LevelEnum.GENERAL_MANAGER]: "Tổng Giám Đốc",
};

export enum WorkExperienceEnum {
  NO_REQUIRED = "no-required",
  UNDER_ONE_YEAR = "duoi_1_nam",
  ONE_YEAR = "1_nam",
  TWO_YEAR = "2_nam",
  THREE_YEAR = "3_nam",
  FOUR_YEAR = "4_nam",
  FIVE_YEAR = "5_nam",
  OVER_FIVE_YEAR = "tren_5_nam",
}

export const WorkExperienceLabelMapping = {
  [WorkExperienceEnum.NO_REQUIRED]: "Không yêu cầu",
  [WorkExperienceEnum.ONE_YEAR]: "1 năm",
  [WorkExperienceEnum.TWO_YEAR]: "2 năm",
  [WorkExperienceEnum.THREE_YEAR]: "3 năm",
  [WorkExperienceEnum.FOUR_YEAR]: "4 năm",
  [WorkExperienceEnum.FIVE_YEAR]: "5 năm",
  [WorkExperienceEnum.OVER_FIVE_YEAR]: "Trên 5 năm",
};

export enum EducationalLevelEnum {
  NO_REQUIRED = "no-required",
  HIGH_SCHOOL = "high-school",
  INTERMEDIATE = "intermediate-level",
  COLLEGE = "college",
  UNIVERSITY = "university",
  POSTGRADUATE = "postgraduate",
}

export const EducationalLevelLabelMapping = {
  [EducationalLevelEnum.NO_REQUIRED]: "Không giới hạn",
  [EducationalLevelEnum.HIGH_SCHOOL]: "Trung học",
  [EducationalLevelEnum.INTERMEDIATE]: "Trung cấp",
  [EducationalLevelEnum.COLLEGE]: "Cao đẳng",
  [EducationalLevelEnum.UNIVERSITY]: "Cử nhân",
  [EducationalLevelEnum.POSTGRADUATE]: "Thạc sĩ/Tiến sĩ",
};