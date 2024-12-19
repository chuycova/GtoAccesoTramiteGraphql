export class NoSqlInyection {

  constructor() {
  }

  remplazar(valor: string): string {
    let nuevovalor = "";
    if(valor!=null){
      valor=valor.trim();
      nuevovalor = valor.replace(/select*/gim, "");
      nuevovalor = valor.replace(/select /gim, "");
      nuevovalor = nuevovalor.replace(/from/gim, "");
      nuevovalor = nuevovalor.replace(/where/gim, "");
      nuevovalor = nuevovalor.replace(/ union /gim, "");
      nuevovalor = nuevovalor.replace(/insert /gim, "");
      nuevovalor = nuevovalor.replace(/update/gim, "");
      nuevovalor = nuevovalor.replace(/drop/gim, "");
      nuevovalor = nuevovalor.replace(/delete/gim, "");
      nuevovalor = nuevovalor.replace(/ and /gim, "");
      nuevovalor = nuevovalor.replace(/ or /gim, "");
      nuevovalor = nuevovalor.replace(/\=/gim, "");
      nuevovalor = nuevovalor.replace(/\'/gim, "");
      nuevovalor = nuevovalor.replace(/\"/gim, "");
      nuevovalor = nuevovalor.replace(/\*/gim, "");
      nuevovalor = nuevovalor.replace(/\-/gim, "");
      nuevovalor = nuevovalor.replace(/ set /gim, "");
    }
    return nuevovalor.normalize('NFC').trim();
  }
}
