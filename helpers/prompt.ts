import { decode } from 'html-entities';
import sanitizeHtml from 'sanitize-html';
import { EducationalLevelLabelMapping, LevelEnum, LevelLabelMapping, WorkExperienceLabelMapping } from '../config/constant';

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