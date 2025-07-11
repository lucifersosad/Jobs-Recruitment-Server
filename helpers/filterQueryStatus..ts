export const filterQueryStatus = (query : string) : boolean => {
    //Tạo một mảng để ghi vào các giá trị mong muốn kiểm tra
    let filterQueryStatus : string[] = ["active","inactive","pending","refuse"];
  
     //Kiểm tra xem trong mảng đã cho có tồn tại query vừa truyền vào hay không
     const checkQuery : boolean = filterQueryStatus.includes(query);

     return checkQuery;
}

export const filterQueryStatusJobsCategories = (query : string) : boolean => {
    //Tạo một mảng để ghi vào các giá trị mong muốn kiểm tra
    let filterQueryStatus : string[] = ["active","inactive"];
  
     //Kiểm tra xem trong mảng đã cho có tồn tại query vừa truyền vào hay không
     const checkQuery : boolean = filterQueryStatus.includes(query);

     return checkQuery;
}

export const filterQueryStatusAdmins = (query : string) : boolean => {
    //Tạo một mảng để ghi vào các giá trị mong muốn kiểm tra
    let filterQueryStatus : string[] = ["active","inactive"];
  
     //Kiểm tra xem trong mảng đã cho có tồn tại query vừa truyền vào hay không
     const checkQuery : boolean = filterQueryStatus.includes(query);

     return checkQuery;
}

export const filterQueryStatusJobs = (query : string) : boolean => {
    //Tạo một mảng để ghi vào các giá trị mong muốn kiểm tra
    let filterQueryStatus : string[] = ["active","inactive","pending","refuse"];
  
     //Kiểm tra xem trong mảng đã cho có tồn tại query vừa truyền vào hay không
     const checkQuery : boolean = filterQueryStatus.includes(query);

     return checkQuery;
}

export const filterQueryStatusJobsEmployer = (query : string) : boolean => {
    //Tạo một mảng để ghi vào các giá trị mong muốn kiểm tra
    let filterQueryStatus : string[] = ["active","inactive"];
  
     //Kiểm tra xem trong mảng đã cho có tồn tại query vừa truyền vào hay không
     const checkQuery : boolean = filterQueryStatus.includes(query);

     return checkQuery;
}

export const filterQueryStatusCvJobsEmployer = (query : string) : boolean => {
    //Tạo một mảng để ghi vào các giá trị mong muốn kiểm tra
    let filterQueryStatus : string[] = ["pending","refuse","accept"];
  
     //Kiểm tra xem trong mảng đã cho có tồn tại query vừa truyền vào hay không
     const checkQuery : boolean = filterQueryStatus.includes(query);

     return checkQuery;
}
