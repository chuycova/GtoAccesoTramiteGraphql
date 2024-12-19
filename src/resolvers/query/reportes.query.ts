import { get_AniosVisitasRegistradas, get_CalendarioSolicitudPorDias, get_GraficaXAnio,  get_GraficaXDia,  get_GraficaXDiaPorFecha,  get_GraficaXSemanaPorFechas, get_ReporteCalendarioSimple, get_ReporteListaNegra, get_ReporteSinSalidasXFecha, get_ReporteSolicitudAcceso, get_SemanaVisitas, get_VisitasCalendario, get_VisitasCalendarioSimple } from "../../constants/reportes-db-operations";

const queryReportes = {
  Query: {
    allReporteVisitas: async (_: any, parent: any, { psql }: any) => {
      let eventQuery = get_ReporteSolicitudAcceso;
      let res = await psql.manyOrNone(eventQuery);
      return res;
    },
    allGraficaXDia: async (_: any, parent: any, { psql }: any) => {
      let eventQuery = get_GraficaXDia;
      let res = await psql.manyOrNone(eventQuery);
      return res;
    },
    // allGraficaXAnio: async (_: any, parent: any, { psql }: any) => {
    //   let eventQuery = get_GraficaXAnio(parent.fechaInicio, parent.fechaFin);
    //   let res = await psql.manyOrNone(eventQuery);
    //   return res;
    // },
    allAniosRegistradosSolicitud: async (_: any, parent: any, { psql }: any) => {
      let eventQuery = get_AniosVisitasRegistradas;
      let res = await psql.manyOrNone(eventQuery);
      return res;
    },
    allReporteXSemanasVisitas: async (_: any, parent: any, { psql }: any) => {
      let eventQuery = get_SemanaVisitas;
      let res = await psql.manyOrNone(eventQuery);
      return res;
    },
    allReporteListaNegra: async (_: any, parent: any, { psql }: any) => {
      let eventQuery = get_ReporteListaNegra;
      let res = await psql.manyOrNone(eventQuery);
      return res;
    },
    allReporteVisitasCalendario: async (_: any, parent: any, { psql }: any) => {
      let eventQuery = get_VisitasCalendario;
      let res = await psql.manyOrNone(eventQuery);
      return res;
    },
    allReporteCalendarioVisitasPorDia: async (_: any, parent: any, { psql }: any) => {
      let eventQuery = get_CalendarioSolicitudPorDias(parent.fecha);
      let res = await psql.manyOrNone(eventQuery);
      return res;
    },
    // allGraficaXDiaPorParametros: async (_: any, parent: any, { psql }: any) => {
    //   let eventQuery = get_GraficaXDiaPorFecha(parent.fechaInicio, parent.fechaFin);
    //   let res = await psql.manyOrNone(eventQuery);
    //   return res;
    // },
    // allGraficaXSemanaPorParametros: async (_: any, parent: any, { psql }: any) => {
    //   let eventQuery = get_GraficaXSemanaPorFechas(parent.fechaInicio, parent.fechaFin);
    //   let res = await psql.manyOrNone(eventQuery);
    //   return res;
    // },
    allReporteSinSalidasXFecha: async (_: any, parent: any, { psql }: any) => {
      let eventQuery = get_ReporteSinSalidasXFecha(parent.fechaInicio, parent.fechaFin);
      let res = await psql.manyOrNone(eventQuery);
      return res;
    },
    allReporteCalendarioSimple: async (_: any, parent: any, { psql }: any) => {
      let eventQuery = get_VisitasCalendarioSimple;
      let res = await psql.manyOrNone(eventQuery);
      return res;
    },
    allReporteCalendarioXAF: async (_: any, parent: any, { psql }: any) => {
      let eventQuery = get_ReporteCalendarioSimple(parent.fecha);
      let res = await psql.manyOrNone(eventQuery);
      return res;
    },

    allGraficaXSemanaPorParametros: async (_: any, parent: any, { psql }: any) => { 
      let result = get_GraficaXSemanaPorFechas(parent.fechaInicio, parent.fechaFin);
      return result;
    },
    allGraficaXDiaPorParametros: async (_: any, parent: any, { psql }: any) => {
      let result = await get_GraficaXDiaPorFecha(parent.fechaInicio, parent.fechaFin); 
      return result;
    },
    allGraficaXAnio: async (_: any, parent: any, { psql }: any) => { 
      let result = get_GraficaXAnio(parent.fechaInicio, parent.fechaFin);
      return result;
    },
    // allGraficaXDia: async (_: any, parent: any, { psql }: any) => {
    //   let result =await get_GraficaXDia(); 
    //   return result;
    // },
  },
};
export default queryReportes; 
