import { EducationalLevelEnum, LevelEnum, WorkExperienceEnum } from "../config/constant";

export const filterQueryWorkExperienceJobs = (query: string): boolean => {

 
  //Tạo một mảng để ghi vào các giá trị mong muốn kiểm tra
  let filterQueryValidate: string[] = Object.values(WorkExperienceEnum);

  //Kiểm tra xem trong mảng đã cho có tồn tại query vừa truyền vào hay không
  const checkQuery: boolean = filterQueryValidate.includes(query);

  return checkQuery;
};

export const filterQueryLevelJobs = (query: string): boolean => {
  
  //Tạo một mảng để ghi vào các giá trị mong muốn kiểm tra
  let filterQueryValidate: string[] = Object.values(LevelEnum)

  //Kiểm tra xem trong mảng đã cho có tồn tại query vừa truyền vào hay không
  const checkQuery: boolean = filterQueryValidate.includes(query);

  return checkQuery;
};

export const filterQueryEducationalLevelJobs = (query: string): boolean => {
  //Tạo một mảng để ghi vào các giá trị mong muốn kiểm tra
  let filterQueryValidate: string[] = Object.values(EducationalLevelEnum);
  //Kiểm tra xem trong mảng đã cho có tồn tại query vừa truyền vào hay không
  const checkQuery: boolean = filterQueryValidate.includes(query);

  return checkQuery;
};
