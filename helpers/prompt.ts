import { decode } from 'html-entities';

const cleanText = (htmlText) => {
  const cleanText = htmlText
    ?.replace(/<\/?ul>/g, "") // xoá <ul> và </ul>
    ?.replace(/<li>/g, "") // thay <li> bằng gạch đầu dòng
    ?.replace(/<\/li>/g, ".") // thay </li> bằng xuống dòng
    ?.replace(/\n\s*\n/g, "") // xoá dòng trắng dư thừa
    ?.trim(); // xoá khoảng trắng đầu/cuối

  return cleanText;
};

const cleanAttributes = (attribute) => {
  const newAttribute = attribute.map(({_id, ...rest}) => ({
    ...rest,
    description: decode(cleanText(rest.description)),
  }));
  return newAttribute;
};

const cleanSkills = (skills) => {
  return skills.map(item => item.skill_name)
}

const inputCv = (objectCv) => {
  const { position, educations, experiences, skills } = objectCv;

  const newEducations = cleanAttributes(educations);

  const newExperiences = cleanAttributes(experiences);

  const newSkills = cleanSkills(skills)

  const filteredObjectCv = {
    position,
    educations: newEducations,
    experiences: newExperiences,
    skills: newSkills,
  };

  return filteredObjectCv;
};

export const cvJsonToPrompt = (myCv) => {
console.log("🚀 ~ cvJsonToPrompt ~ myCv:", myCv)

  const cv = inputCv(myCv);
  console.log("🚀 ~ cvJsonToPrompt ~ cv:", cv)

  const lines = [];

  if (cv.position) {
    lines.push(`\nChức danh hiện tại: ${cv.position}`, );
  }

  if (cv.skills && cv.skills.length > 0) {
    lines.push(`\nKỹ năng:`);
    cv.skills.forEach(skill => lines.push(`- ${skill}`));
  }

  if (cv.experiences && cv.experiences.length > 0) {
    lines.push(`\nKinh nghiệm:`);
    cv.experiences.forEach((exp, index) => {
      lines.push(`${index + 1}. ${exp.company_name} – ${exp.position_name}`);
      if (exp.start_date && exp.end_date) lines.push(`   Thời gian: ${exp.start_date} - ${exp.end_date}`);
      if (exp.description) {
        lines.push(`- ${exp.description}`)
      }
    });
  }

  if (cv.educations && cv.educations.length > 0) {
    lines.push(`\nHọc vấn:`);
    cv.educations.forEach((edu) => {
      lines.push(`- ${edu.school_name}`);
      if (edu.title) lines.push(`  Chuyên ngành: ${edu.title}`);
      if (edu.description) lines.push(`  GPA: ${edu.description}`);
      });
  }

  // if (cv.certificates && cv.certificates.length > 0) {
  //   lines.push(`\nChứng chỉ:`);
  //   cv.certificates.forEach(cert => lines.push(`- ${cert}`));
  // }

  return lines.join('\n');
};