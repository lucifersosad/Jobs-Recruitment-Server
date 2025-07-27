
interface ObjectPagination{
    currentPage? : number,
    limitItem? : number
    skip? : number,
    totalPage? : number,
    remainingItem?: number,
    nextPage?: number,
}


//Chúng ta phải truyền 3 tham số
//countRecord: Số lượng sản phẩm của bảng
//checkPage: Page hiện tại của sản phẩm
//limitPage: Số lượng sản phẩm cần hiển thị
export const filterQueryPagination = (countRecord : number, currentPage : number , limitItem :number ) : ObjectPagination => {
    //Khai báo biến phân trang
    let objectPagination : ObjectPagination = {
        //Nếu checkPage không có nó sẽ là 1
        currentPage: currentPage ,
        limitItem: limitItem,
    };
 
    //Thêm skip cho phân trang 
    objectPagination.skip = (currentPage - 1) * limitItem;
    //Tính số Page sản phẩm cho trang
    const totalPage : number = Math.ceil(countRecord / limitItem);
    objectPagination.totalPage = totalPage;
    const remainingItem = countRecord > limitItem ? countRecord - limitItem : 0;
    const nextPage = currentPage < totalPage ? currentPage + 1 : null
    objectPagination.remainingItem = remainingItem;
    objectPagination.nextPage = nextPage;
    return objectPagination;
}