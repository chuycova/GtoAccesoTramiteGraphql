import query from './query';
import types from './types';
import mutation from './mutation';

const resolvers = {
    ...query,
    ...types,
    ...mutation
}

export default resolvers;