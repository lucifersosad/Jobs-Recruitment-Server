import { slugCheckAB } from "./convertSub";
import { convertToSlug } from "./convertToSlug";

export function searchPro(
  listItem: any[],
  unidecodeSlug: string,
  keyOne: string = "",
  keyTwo: string = ""
): any[] {
  console.log("🚀 ~ listItem:", listItem)
  //Duyệt qua từng phần tử của listItem và gôp chung lại thành một mảng hàm flatMap là vậy
  const convertArrr = listItem
    .flatMap((item) =>
      //Lấy ra những phần tử có slug giống với slug của keyword
      item[keyOne].map((element, index) => {
        //Chuyển đổi slug của element
        const unidecodeElement = convertToSlug(element);
        //Kiểm tra xem element có bắt đầu bằng slug không
        if (slugCheckAB(unidecodeSlug, unidecodeElement)) {
          //Nếu có thì trả về element và slug của element
          return {
            listTagName: element,
            listTagSlug: item[keyTwo][index],
          };
        }
      })
    ) //Lọc ra những phần tử không phải là false, 0, "", null, undefined, và NaN.
    .filter(Boolean);
  console.log("🚀 ~ convertArrr:", convertArrr);
  return convertArrr;
}
