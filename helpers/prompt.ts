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

export const promptCvBuild = (userDescription) => {
  return `
    Hãy tạo một CV mẫu phù hợp cho người dùng có đoạn mô tả như sau: "${userDescription}"
    Yêu cầu:
    - Sử dụng từ khóa phù hợp với vị trí công việc.
    - Sử dụng cấu trúc rõ ràng, súc tích và dễ đọc cho máy.
    - Không dùng từ ngữ mang tính cảm tính, mơ hồ (ví dụ: "nhiệt huyết", "năng động").
    - Ưu tiên kĩ năng chuyên môn, hạn chế kĩ năng mềm
    - Ưu tiên mô tả bằng bullet points ngắn gọn và trực tiếp.
    - Ngoại trừ vị trí công việc có thể là tiếng Anh, luôn trả lời bằng tiếng Việt
    Trả về kết quả dưới dạng JSON với cấu trúc sau: 
    
    { 
      "jobTitle": "string" // chức danh công việc,
      "objective": "string", // đoạn tóm tắt chuyên nghiệp 2–3 câu, nêu rõ số năm kinh nghiệm (nếu có). Nếu kinh nghiệm làm việc liên quan trực tiếp tới vị trí ứng tuyển thì đề cập những kỹ năng chuyên môn nổi bật. Đề cập những thành tựu chính trong quá khứ (nếu có). Luôn có mong muốn phát triển nghề nghiệp trong tương lai. Luôn bắt đầu bằng: "Tôi...". Sử dụng từ khóa phù hợp với vị trí và tránh từ ngữ cảm tính. 
      "skills": ["string"], // kỹ năng chuyên môn nếu ứng viên có từ kinh nghiệm làm việc liên quan tới ví trí ứng tuyển, dạng danh sách từ khóa, ngắn gọn 
      "educations": [ 
        { 
          "title": "string", 
          "school_name": "string", 
          "start_date": "MM/YYYY", 
          "end_date": "MM/YYYY", 
          "description": ["string"] // không đề cập các môn học trong chương trình, liệt kê theo bullet hoặc mô tả vắn tắt 
        } 
      ] || [], 
      "experiences": [ 
        { 
          "position_name": "string", 
          "company_name": "string", 
          "start_date": "MM/YYYY", 
          "end_date": "MM/YYYY", 
          "description": ["string"] // dùng từ khóa, gạch đầu dòng, nhấn mạnh kết quả 
        } 
      ] || [] 
    }
  `;
};

export const promptCvSummary = (cvText) => {
  return `
    Tóm tắt nội dung CV sau để lấy các thông tin quan trọng nhất như:
    - Kinh nghiệm làm việc
    - Kỹ năng
    - Học vấn
    - Mục tiêu nghề nghiệp (nếu có)
    Dưới dạng đoạn văn dễ hiểu và ngắn gọn nhất. Dữ liệu gốc:
    ${cvText}
  `
}



