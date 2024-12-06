import { Request, Response } from "express";
import Job from "../../../../models/jobs.model";

const generateRandomPhone = () => {
  const prefix = [
    "090",
    "091",
    "092",
    "093",
    "094",
    "095",
    "096",
    "097",
    "098",
  ];
  const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)];
  const randomNumber = Math.floor(1000000 + Math.random() * 9000000);
  return randomPrefix + randomNumber;
};

const getRandomFromArray = (array, max = 1) =>
  Array.from(
    { length: Math.floor(Math.random() * max) + 1 },
    () => array[Math.floor(Math.random() * array.length)]
  );

const generateRandomDate = (monthsAhead) => {
  const currentDate = new Date();
  currentDate.setMonth(
    currentDate.getMonth() + Math.floor(Math.random() * monthsAhead) + 1
  );
  return currentDate.toISOString(); // Trả về kiểu datetime
};

const generateRandomSalary = (min, max, step = 1000000) =>
  Math.floor(Math.random() * ((max - min) / step + 1)) * step + min;

const generateRandomObject = () => {
  const listTagName = [
    "Javascript",
    "NestJS",
    "PHP",
    "Python",
    "Java",
    "Angular",
    "NodeJS",
    "ReactJS",
    "VueJS",
    "NextJS",
  ];
  const randomListTagName = getRandomFromArray(listTagName, 2); // Lấy tối đa 2 giá trị
  const randomTitle =
    randomListTagName[Math.floor(Math.random() * randomListTagName.length)]; // Chọn ngẫu nhiên 1 giá trị từ listTagName

  const phone = generateRandomPhone();
  const email = `mail${phone}@gmail.com`;

  return {
    listTagName: randomListTagName, // Đặt listTagName trong cùng object
    title: `Lập trình viên ${randomTitle}`, // Đảm bảo title chứa giá trị từ listTagName
    job_categorie_id: getRandomFromArray(
      [
        "675285a3e4f133ef42b24d8d",
        "67522764bf184671d3f8b8fc",
        "6752278bbf184671d3f8b908",
        "675227d2bf184671d3f8b920",
        "67528564e4f133ef42b24d75",
        "675285c3e4f133ef42b24d99",
        "675285efe4f133ef42b24db1",
        "6752862fe4f133ef42b24dc9",
      ],
      3
    ),
    city: { slug: "ho-chi-minh", code: 79, name: "Hồ Chí Minh" },
    address: { linkMap: [], location: "" },
    description: `
      <ul>
        <li>Develop and maintain web application using ReactJs</li>
        ...
        <li>Stay up-to-date with the latest industry trends and technologies.</li>
      </ul>`,
    detailWorkExperience: `
      <ul>
        <li>2+ years of ReactJS development</li>
        ...
        <li>Experience with DevOps (EC2, S3, Route53, Cloudfare, CI/CD ...)</li>
      </ul>`,
    linkVideoAboutIntroducingJob: "https://www.youtube.com/watch?v=sQH0-tBvyY4",
    welfare: getRandomFromArray(
      ["laptop", "allowance", "health-care", "training"],
      3
    ),
    salaryMin: generateRandomSalary(5000000, 15000000),
    salaryMax: generateRandomSalary(15000000, 50000000),
    jobType: [
      getRandomFromArray(
        ["official-employee", "part-time", "seasonal-freelance", "intern"],
        1
      )[0],
    ],
    end_date: generateRandomDate(4),
    presentationLanguage: ["english"],
    phone,
    email,
    receiveEmail: "vietnamese",
    countOpenCv: 0,
    status: "active",
    deleted: false,
    website: "abc.com",
    level: getRandomFromArray(
      [
        "student-intern",
        "just-have-graduated",
        "staff",
        "teamleader-supervisor",
        "manager",
      ],
      1
    )[0],
    ageMin: 18,
    ageMax: 25,
    gender: "all",
    educationalLevel: "university",
    workExperience: getRandomFromArray(
      [
        "no-required",
        "no-experience-yet",
        "duoi_1_nam",
        "1_nam",
        "2_nam",
        "3_nam",
        "4_nam",
        "5_nam",
        "tren_5_nam",
      ],
      1
    )[0],
    employerId: getRandomFromArray(
      [
        "674cb3d1a29e5956f91465ce",
        "674d3d1a8f507102fb18cd9f",
        "674d3d298f507102fb18cda1",
        "674d3d558f507102fb18cda4",
        "674d3dbb8f507102fb18cda6",
        "674d3e578f507102fb18cda8",
        "674d3ecc8f507102fb18cdab",
        "67529007d656279dbac10267",
      ],
      1
    )[0],
    featured: Math.random() < 0.5,
  };
};

export const seedData = async (req: Request, res: Response): Promise<void> => {

  for (let i = 0; i < 10; i++) {
    const job = generateRandomObject();
    const record = new Job(job);
    await record.save();
  }

  res.status(200).json({ data: "OK", code: 200 });
  return;
};
