import GMR from "graphql-merge-resolvers";
import queryGeneral from "./general.query";
import queryTramiteCita from "./tramite-cita.query";
import queryAcceso from "./acceso.query";
import queryReportes from "./reportes.query";
import queryAccesoGto from "./acceso-gto.query";

const resolversQueries = GMR.merge([queryGeneral, queryTramiteCita, queryAcceso,queryReportes,queryAccesoGto]);

export default resolversQueries;
