import { ApiWelcome } from "../data/envio-cita-app";
import { MailAPI } from "../data/mail-source";

const _ApiMail = new MailAPI();
const _ApiWelcome = new ApiWelcome();

export class NotificionVisita {
  constructor() {}

  async notificacionCorreo(
    platilla: any,
    UsuarioCopiaCita: any,
    UsuarioLoginCorreo: any,
    datos: any,
    qrbase64: any
  ): Promise<any> {
    if (datos.CorreoInvitado != '' && datos.CorreoInvitado != null && datos.CorreoInvitado != undefined) {
      let emailObjeto = {
        nombreenvia: "Control Acceso",
        titulo: "Invitación",
        cuerpohtml: "",
        destinatarios: [
          {
            Nombre: "",
            Correo: "",
          },
        ],
        destinatariosOculto: [
          {
            Nombre: "",
            Correo: "",
          },
        ],
        password: "gt02024_",
        Adjuntos: [
          {
            FileName: "qr.png",
            ArchivoB64: "",
          },
        ],
      };

      emailObjeto.nombreenvia = platilla.NombreEnvia;
      emailObjeto.titulo = platilla.TituloAceptacion;

      if(UsuarioCopiaCita==true)
        emailObjeto.destinatariosOculto = [
          {
            Nombre: `Solicitante`,
            Correo: UsuarioLoginCorreo,
          },
        ];

      let curpoHtml = platilla.TextoString;

      curpoHtml = curpoHtml.replace(/@receptor/gi, datos.NombreInvitado);
      curpoHtml = curpoHtml.replace(/@nombreDependencia/gi, datos.VisitaA);
      curpoHtml = curpoHtml.replace(/@fechaVisita/gi, datos.fechaFormateada);
      curpoHtml = curpoHtml.replace(/@horaVisita/gi, datos.horaFormateada);
      curpoHtml = curpoHtml.replace(/@direccionSede/gi, datos.SedeDireccion);
      curpoHtml = curpoHtml.replace(/@piso/gi, datos.Edificio);
      curpoHtml = curpoHtml.replace(/@imgqr/gi, qrbase64);

      emailObjeto.cuerpohtml = curpoHtml;

      emailObjeto.destinatarios = [
        {
          Nombre: `${datos.NombreInvitado}`.trim().toUpperCase(),
          Correo: datos.CorreoInvitado,
        },
      ];

      emailObjeto.Adjuntos = [
        {
          FileName:
            datos.NombreInvitado.toLowerCase().replace(/ /g, "-") + "-qr.png",
          // ArchivoB64: qrbase64,
          ArchivoB64: qrbase64.split(",")[1],
        },
      ];
      if(datos.TipoEstacionamientoBase64!=null && datos.TipoEstacionamientoBase64!= undefined){
        let conEstacionamiento = 
        {
          FileName: `${datos.TipoEstacionamiento.replace(/ /g,"_")}.png`,
          ArchivoB64: datos.TipoEstacionamientoBase64,
        };
        
        emailObjeto.Adjuntos.push(conEstacionamiento);
      }
      try {
        const response = await _ApiMail.envioMailCC_CCO(emailObjeto);
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  }
  async notificacionCorreoVigencia(
    platilla: any,
    UsuarioCopiaCita: any,
    UsuarioLoginCorreo: any,
    datos: any,
    qrbase64: any
  ): Promise<any> {
    if (datos.Correo != '' && datos.Correo!= null && datos.Correo != undefined) {
      let emailObjeto = {
        nombreenvia: "Control Acceso",
        titulo: "Invitación",
        cuerpohtml: "",
        destinatarios: [
          {
            Nombre: "",
            Correo: "",
          },
        ],
        destinatariosOculto: [
          {
            Nombre: "",
            Correo: "",
          },
        ],
        password: "gt02024_",
        Adjuntos: [
          {
            FileName: "qr.png",
            ArchivoB64: "",
          },
        ],
      };

      emailObjeto.nombreenvia = platilla.NombreEnvia;
      emailObjeto.titulo = platilla.TituloAceptacion;

      if(UsuarioCopiaCita==true)
        emailObjeto.destinatariosOculto = [
          {
            Nombre: `Solicitante`,
            Correo: UsuarioLoginCorreo,
          },
        ];

      let curpoHtml = platilla.TextoString;

      let fechas = datos.fechasVigentes.split(";");
      
      let TextoFechas = '<ul>';
      fechas.forEach((element:any) => {
        TextoFechas += `<li><strong>${element}</strong></li>`;
      });
      TextoFechas += '</ul>';


      curpoHtml = curpoHtml.replace(/@receptor/gi, datos.NombreInvitado);
      curpoHtml = curpoHtml.replace(/@nombreDependencia/gi, datos.Dependencia);
      curpoHtml = curpoHtml.replace(/@fechasVigencia/gi, TextoFechas);
      curpoHtml = curpoHtml.replace(/@direccionSede/gi, datos.Direccion);
      curpoHtml = curpoHtml.replace(/@piso/gi, datos.Edificio);
      curpoHtml = curpoHtml.replace(/@imgqr/gi, qrbase64);

      emailObjeto.cuerpohtml = curpoHtml;

      emailObjeto.destinatarios = [
        {
          Nombre: `${datos.NombreInvitado}`.trim().toUpperCase(),
          Correo: datos.Correo,
        },
      ];

      emailObjeto.Adjuntos = [
        {
          FileName:
            datos.NombreInvitado.toLowerCase().replace(/ /g, "-") + "-qr.png",
          // ArchivoB64: qrbase64,
          ArchivoB64: qrbase64.split(",")[1],
        },
      ];
      if(datos.TipoEstacionamientoBase64!=null && datos.TipoEstacionamientoBase64!= undefined){
        let conEstacionamiento = 
        {
          FileName: `${datos.TipoEstacionamiento.replace(/ /g,"_")}.png`,
          ArchivoB64: datos.TipoEstacionamientoBase64,
        };
        
        emailObjeto.Adjuntos.push(conEstacionamiento);
      }
      try {
        const response = await _ApiMail.envioMailCC_CCO(emailObjeto);
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  async notificacionWhatsApp(
    platilla: any,
    datos: any,
    qrbase64: any
  ): Promise<any> {
    if (datos.Telefono != '' && datos.Telefono != null && datos.Telefono != undefined) {
      let mensaje = platilla.TextoString;
      mensaje = mensaje.replace(/@receptor/gi, datos.NombreInvitado);
      mensaje = mensaje.replace(/@nombreDependencia/gi, datos.VisitaA);
      mensaje = mensaje.replace(/@fechaVisita/gi, datos.fechaFormateada);
      mensaje = mensaje.replace(/@horaVisita/gi, datos.horaFormateada);
      mensaje = mensaje.replace(/@direccionSede/gi, datos.SedeDireccion);
      mensaje = mensaje.replace(/@piso/gi, datos.Edificio);

      let body = {
        correo_O_Numero: datos.Telefono,
        titulo: platilla.TituloAceptacion,
        mensaje: mensaje.trim(),
        adjuntos: [qrbase64],
        tipo: 4,
      };
      try {
        const response = await _ApiWelcome.api_whatsApp_cita_solicitud(body);
        if (response == "") {
          return { status: true, message: "WhatsApp Enviado" };
        }
        return { status: false, message: "WhatsApp Error" };
      } catch (error: any) {
        return { status: false, message: error };
      }
    }
    return { status: false, message: "Sin Número" };
  }
  
  async notificacionCorreoGTO(
    platilla: any,
    datos: any,
    qrbase64: any
  ): Promise<any> {
    if (datos.CorreoInvitado != '' && datos.CorreoInvitado != null && datos.CorreoInvitado != undefined) {
      let emailObjeto = {
        nombreenvia: "Control Acceso",
        titulo: "Invitación",
        cuerpohtml: "",
        destinatarios: [
          {
            Nombre: "",
            Correo: "",
          },
        ],
        destinatariosOculto: [
          // {
          //   Nombre: "",
          //   Correo: "",
          // },
        ],
        password: "gt02024_",
        Adjuntos: [
          {
            FileName: "qr.png",
            ArchivoB64: "",
          },
        ],
      };
      
      let OidInvertido = datos.Oid.toString().split('').reverse().join('');
      let OidBase64 = Buffer.from(OidInvertido).toString('base64');
      let calveParte1 = datos.Oid.slice(0,8);
      let calveParte2 = datos.Oid.slice(32,36);

      emailObjeto.nombreenvia = platilla.NombreEnvia;
      emailObjeto.titulo = platilla.TituloAceptacion;

      // emailObjeto.destinatariosOculto = [
      //   {
      //     Nombre: `Solicitante`,
      //     Correo: UsuarioLoginCorreo,
      //   },
      // ];

      let curpoHtml = platilla.TextoString;

      curpoHtml = curpoHtml.replace(/@receptor/gi, datos.NombreInvitado);
      curpoHtml = curpoHtml.replace(/@nombreDependencia/gi, datos.VisitaA);
      curpoHtml = curpoHtml.replace(/@fechaVisita/gi, datos.fechaFormateada);
      curpoHtml = curpoHtml.replace(/@horaVisita/gi, datos.horaFormateada);
      curpoHtml = curpoHtml.replace(/@direccionSede/gi, datos.SedeDireccion);
      curpoHtml = curpoHtml.replace(/@piso/gi, datos.Edificio);
      curpoHtml = curpoHtml.replace(/@usuarioClave/gi, calveParte1);
      curpoHtml = curpoHtml.replace(/@pinClave/gi, calveParte2);
      curpoHtml = curpoHtml.replace(/@Id/gi, OidBase64);
      curpoHtml = curpoHtml.replace(/@imgqr/gi, qrbase64);

      emailObjeto.cuerpohtml = curpoHtml;

      emailObjeto.destinatarios = [
        {
          Nombre: `${datos.NombreInvitado}`.trim().toUpperCase(),
          Correo: datos.CorreoInvitado,
        },
      ];
      
      emailObjeto.Adjuntos = [
        {
          FileName:
            datos.NombreInvitado.toLowerCase().replace(/ /g, "-") + "-qr.png",
          // ArchivoB64: qrbase64,
          ArchivoB64: qrbase64.split(",")[1],
        },
      ];
      if(datos.TipoEstacionamientoBase64!=null && datos.TipoEstacionamientoBase64!= undefined){
        let conEstacionamiento = 
        {
          FileName: `${datos.TipoEstacionamiento.replace(/ /g,"_")}.png`,
          ArchivoB64: datos.TipoEstacionamientoBase64,
        };
        
        emailObjeto.Adjuntos.push(conEstacionamiento);
      }

      try {
        const response = await _ApiMail.envioMailCC_CCO(emailObjeto);
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  }
}
