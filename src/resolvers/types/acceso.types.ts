import { get_HistorialEntradaSalidaSolicitudAcceso } from "../../constants/acceso-db-operations";

const resolverType = {
    ResultSolicitudAcceso: {
        HistorialEntradaSalida: async (parent: any, __: any, { psql }: any) => {
        const eventQuery = `SELECT '${parent.Oid}' AS "Solicitud"`;
        const res = await psql.oneOrNone(eventQuery);
        return res;
        },
    },
    HistorialEntradaSalida: {
        Entradas: async (parent: any, __: any, { psql }: any) => {
            const eventQuery = get_HistorialEntradaSalidaSolicitudAcceso(parent.Solicitud,1);
            const res = await psql.manyOrNone(eventQuery);
            return res;
        },
        Salidas: async (parent: any, __: any, { psql }: any) => {
            const eventQuery = get_HistorialEntradaSalidaSolicitudAcceso(parent.Solicitud,2);
            const res = await psql.manyOrNone(eventQuery);
            return res;
        },
    },
};

export default resolverType;