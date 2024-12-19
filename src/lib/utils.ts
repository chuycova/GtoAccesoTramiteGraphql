export class Utils {

  constructor() {
  }

  
  removeAccents(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u0301]/g, "");
  }
  
  removeEspacios(str: string): string {
    return str.replace(/\s+/g, '');
  }

  levenshteinDistance(str1:string, str2:string) {
    const matrix = Array(str1.length + 1).fill(null).map(() => Array(str2.length + 1).fill(null));
  
    for (let i = 0; i <= str1.length; i++) {
      matrix[i][0] = i;
    }
  
    for (let j = 0; j <= str2.length; j++) {
      matrix[0][j] = j;
    }
  
    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
  
    return matrix[str1.length][str2.length];
  }
  
  formatDateToYYYYMMDD(date:Date) {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // getMonth() returns 0-11
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}${month}${day}`;
  }
}
