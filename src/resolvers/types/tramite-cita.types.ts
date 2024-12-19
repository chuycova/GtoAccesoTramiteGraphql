// import { get_CitasTipoVisita, get_TipoGruposTipoVisita } from "../../constants/tramite-cita-db-operations";

import { get_FechasXSedeTramite, get_HorariosXSedeTramite } from "../../constants/tramite-cita-db-operations";

const resolverType = {
  SedeTramite: {
    Fechas: async (parent: any, __: any, { psql }: any) => {
        const eventQuery = get_FechasXSedeTramite(parent.SedeTramite);
        const res = await psql.manyOrNone(eventQuery);
        return res;
      },
    },
    FechaCita: {
      Horarios: async (parent: any, __: any, { psql }: any) => {
          const eventQuery = get_HorariosXSedeTramite(parent.SedeTramite,parent.FechaCita);
          const res = await psql.manyOrNone(eventQuery);
          return res;
        },
      },
  // Usuario: {
  //   TiposVisitas: async (parent: any, __: any, { psql }: any) => {
  //     const eventQuery = get_TiposVisitas(parent.Oid);
  //     const res = await psql.manyOrNone(eventQuery);
  //     return res;
  //   },
  // },
  // ResultTipoVisita: {
  //   Citas: async (parent: any, __: any, { psql }: any) => {
  //     const eventQuery = get_CitasTipoVisita(parent.Oid);
  //     const res = await psql.manyOrNone(eventQuery);
  //     return res;
  //   },
  //   Grupos: async (parent: any, __: any, { psql }: any) => {
  //     const eventQuery = get_TipoGruposTipoVisita(parent.Oid);
  //     const res = await psql.manyOrNone(eventQuery);
  //     return res;
  //   },
  // },
};

export default resolverType;