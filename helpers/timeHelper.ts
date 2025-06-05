export const timeAgo = (date: Date): string => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
    if (seconds < 60) return `${seconds} giây trước`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} tháng trước`;
    const years = Math.floor(months / 12);
    return `${years} năm trước`;
  };

  export const timeDuration = (startMonthStr, startYearStr, endMonthStr, endYearStr) => {
  const startMonth = parseInt(startMonthStr);
  const startYear = parseInt(startYearStr);

  const now = new Date();
  const endMonth = endMonthStr ? parseInt(endMonthStr) : now.getMonth() + 1; // getMonth trả 0-11
  const endYear = endYearStr ? parseInt(endYearStr) : now.getFullYear();

  const start = new Date(startYear, startMonth - 1);
  const end = new Date(endYear, endMonth - 1);

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  return `${years} năm ${months} tháng`;
};

  