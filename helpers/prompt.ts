import { decode } from 'html-entities';
import sanitizeHtml from 'sanitize-html';
import { EducationalLevelLabelMapping, LevelEnum, LevelLabelMapping, WorkExperienceLabelMapping } from '../config/constant';
import { timeDuration } from './timeHelper';

const clean = (dirty) => {
  return sanitizeHtml(dirty, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

const getLevelLabel = (value) => {
  return LevelLabelMapping[value] || '';
};

const getWorkExperienceLabel = (value) => {
  return WorkExperienceLabelMapping[value] || '';
};

const getEducationalLevelLabel = (value) => {
  return EducationalLevelLabelMapping[value] || '';
};

export const promptJob = (job) => {

  try {
    const formatTitle = clean(job.title)
    const formatdescription= clean(job.description)
    const formatdetailWorkExperience = clean(job.detailWorkExperience)
    const formatLevel = getLevelLabel(job.level);
    const formatWorkExperience = getWorkExperienceLabel(job.workExperience);
    const formatEducationalLevel = getEducationalLevelLabel(job.educationalLevel);
    const formatSkills = job?.skills?.length > 0 ? job.skills.join(", ") : ""

    const lines = [];

    formatTitle && lines.push(`\nChức danh tuyển dụng: ${formatTitle}`)
    formatdescription && lines.push(`\nMô tả chi tiết:\n ${formatdescription}`)
    formatdetailWorkExperience && lines.push(`\nYêu cầu công việc:\n ${formatdetailWorkExperience}`)
    formatLevel && lines.push(`\nCấp bậc: ${formatLevel}`)
    formatWorkExperience && lines.push(`\nSố năm kinh nghiệm: ${formatWorkExperience}`)
    // formatEducationalLevel && lines.push(`\nTrình độ học vấn tối thiểu: ${formatEducationalLevel}`)
    formatSkills && lines.push(`\nKỹ năng: ${formatSkills}`)

    return lines.join("\n")
  } catch (error) {
    console.log("🚀 ~ promtJob ~ error:", error)
    return;
  }
}

export const promptJobEmbedding = (job) => {

  const { job_categorie_id, workExperience, level, gender, city, skills } = job

  const formatJobCategorie = job_categorie_id?.length > 1 ? job_categorie_id[1]?.title : ""
  const formatWorkExperience = getWorkExperienceLabel(workExperience);
  const formatLevel = getLevelLabel(level);
  const formatGender = gender === "boy" ? "Nam" : "Nữ"
  const formatCity = city?.name ? city.name : ""
  const formatSkills = skills?.length > 0 ? skills.join(", ") : ""

  const lines = [];
  
  lines.push("Tuyển dụng vị trí việc làm")
  formatJobCategorie && lines.push(`\nNgành nghề: ${formatJobCategorie}`)
  formatWorkExperience && lines.push(`\nSố năm kinh nghiệm: ${formatWorkExperience}`)
  formatLevel && lines.push(`\nCấp bậc: ${formatLevel}`)
  formatGender && lines.push(`\nGiới tính: ${formatGender}`)
  formatCity && lines.push(`\nĐịa điểm: ${formatCity}`)
  formatSkills && lines.push(`\nKỹ năng: ${formatSkills}`)

  return lines.join("");
};

export const promptUser = (user) => {

  const { fullName, job_categorie_id, jobTitle, yoe, skills, experiences, educations, address, gender } = user

  const formatGender = gender === 2 ? "Nam" : "Nữ"
  const formatJobCategorie =  job_categorie_id?.title ? job_categorie_id.title : ""
  const formatSkills = skills?.length > 0 ? skills.map(item => item?.title).join(", ") : ""
  const formatYOE = yoe > 0 ? `${yoe} năm` : ""
  const formatEducations = educations?.length > 0 ? educations.map(item => `Chuyên ngành ${item.title} tại ${item.school_name}`).join("; ") : ""
  const formatExperiences = experiences?.length > 0 
    ? experiences
      .map(item => `${item?.position_name} tại ${item?.company_name} ${timeDuration(item?.start_month, item?.start_year, item?.end_month, item?.end_year)}`)
      .join("; ") 
    : ""
  const formatAddress = address?.city && address?.city.split("/")[1] ? address?.city.split("/")[1] : ""

  const lines = [];

  lines.push(`\nHọ tên ứng viên xin việc: ${fullName}`)

  formatGender && lines.push(`\nGiới tính: ${formatGender}`)
  formatJobCategorie && lines.push(`\nNgành nghề hiện tại: ${formatJobCategorie}`)
  formatYOE && lines.push(`\nSố năm kinh nghiệm: ${formatYOE}`)
  jobTitle && lines.push(`\nVị trí hiện tại: ${jobTitle}`)
  formatExperiences && lines.push(`\nKinh nghiệm: ${formatExperiences}`)
  formatSkills && lines.push(`\nKỹ năng: ${formatSkills}`)
  formatEducations && lines.push(`\nHọc vấn: ${formatEducations}`)
  formatAddress && lines.push(`\nĐịa điểm làm việc: ${formatAddress}`)
  return lines.join('');
};

export const promptJobEmbeddingV2 = (job) => {
  const { title, description, detailWorkExperience, skills, job_categorie_id } = job

  const formatJobCategorie = job_categorie_id?.length > 1 ? job_categorie_id[1]?.title : ""
  const formatdescription= clean(description)
  const formatdetailWorkExperience = clean(detailWorkExperience)
  const formatSkills = skills?.length > 0 ? skills.join(", ") : ""

  const lines = []

  title && lines.push(`\nChúng tôi đang tuyển dụng vị trí: ${title}`)
  formatJobCategorie && lines.push(`Ngành nghề: ${formatJobCategorie}`)
  formatdescription && lines.push(`Mô tả: ${formatdescription}`)
  formatdetailWorkExperience && lines.push(`Yêu cầu công việc: ${formatdetailWorkExperience}`)
  formatSkills && lines.push(`Kĩ năng: ${formatSkills}`)

  return lines.join("\n")
};

export const promptUserEmbeddingV2 = (user) => {
  const {
    job_categorie_id,
    jobTitle,
    skills,
    experiences,
    educations,
  } = user;

  const formatJobCategorie = job_categorie_id?.title || "";
  const formatSkills = skills?.length > 0 ? skills.map(item => item?.title).join(", ") : "";
  const formatExperiences = experiences?.length > 0
    ? experiences.map(item =>
        `${item?.position_name} tại ${item?.company_name}`
      ).join("; ")
    : ""
  const formatEducations = educations?.length > 0
    ? educations.map(item => `chuyên ngành ${item.title} tại ${item.school_name}`).join("; ")
    : "";

  const parts = [];

  jobTitle && parts.push(`Ứng viên có chức danh: ${jobTitle}`)
  formatJobCategorie && parts.push(`Ngành nghề: ${formatJobCategorie}`)
  formatExperiences && parts.push(`Kinh nghiệm làm việc: ${formatExperiences}`);
  formatEducations && parts.push(`Học vấn: ${formatEducations}`);
  formatSkills && parts.push(`Kỹ năng chuyên môn: ${formatSkills}`);

  return parts.join("\n");
};

export const promptCvBuild = (jobTitle) => {
  return `
    Hãy tạo một CV mẫu phù hợp cho chức danh công việc "${jobTitle}".
    Bao gồm các mục: mục tiêu nghề nghiệp, kỹ năng nổi bật, học vấn và kinh nghiệm làm việc (giả định nếu cần).
    Trả về kết quả dưới dạng JSON với cấu trúc sau:

    {
      "objective": "string",
      "skills": ["string"],
      "educations": [
        {
          "title": "string",
          "school_name": "string",
          "start_date": "MM/YYYY",
          "end_date": "MM/YYYY",
          "description": "string"
        }
      ],
      "experiences": [
        {
          "position_name": "string",
          "company_name": "string",
          "start_date": "MM/YYYY",
          "end_date": "MM/YYYY",
          "description": "string"
        }
      ]
    }
  `;
};



