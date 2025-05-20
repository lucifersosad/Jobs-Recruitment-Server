const objectCv = require("./cv.json");

const cleanText = (htmlText) => {
  const cleanText = htmlText
    .replace(/<\/?ul>/g, "") // xoá <ul> và </ul>
    .replace(/<li>/g, "") // thay <li> bằng gạch đầu dòng
    .replace(/<\/li>/g, ".") // thay </li> bằng xuống dòng
    .replace(/\n\s*\n/g, "") // xoá dòng trắng dư thừa
    .trim(); // xoá khoảng trắng đầu/cuối

  return cleanText;
};

const cleanAttributes = (attribute) => {
  const newAttribute = attribute.map(({_id, ...rest}) => ({
    ...rest,
    description: cleanText(rest.description),
  }));
  return newAttribute;
};

const cleanSkills = (skills) => {
  return skills.map(item => item.skill_name)
}

const inputCv = () => {
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

const inputJob = () => {
  const lines = [];
  lines.push("\nVị trí tuyển dụng: Entity Data Management Associate")
  lines.push("\nMô tả công việc: Accountable for accuracy and completeness of entity data in Source, Salesforce and Oracle. Reviewing each request to create / update entity. Verifying required information using authorised sources. Researching to enrich entity records as required by EMS. Managing approvals process. Reviewing DQ dashboard and Duplicates dashboard and action as required. Providing reports and data extracts from source / core systems when required.")
  lines.push("\nYêu cầu công việc: Research skills to be able to find entity information/ data from authorised sources. Ability to perform repetitive tasks with a high degree of accuracy. Strong attention to detail. Strong problem solving skills. English proficient")
  lines.push("\nCấp bậc: Mới Tốt Nghiệp")
  lines.push("\nSố năm kinh nghiệm: Không yêu cầu")
  lines.push("\nKỹ năng: Research Ability, Data Management")

  return lines.join("\n")
}

const cvJsonToPrompt = () => {
  const cv = inputCv();

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


const generatePrompt = () => {
  const CV = cvJsonToPrompt();
  const Job = inputJob()

//   return `You are a recruitment specialist. I will give you a JSON-style CV and a job description. Please evaluate the CV and suggest specific improvements to make it more suitable for the job offer. 
// Your response should be concise and focused on actionable changes.

// CV: ${CV}
// Job: ${Job}
//   `;

  return `---- CV: ${CV}\n\n---- Job: ${Job}`;
};

const prompt = generatePrompt();
console.log("🚀 ~ prompt:", prompt)
