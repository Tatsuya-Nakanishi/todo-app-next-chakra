import { Mutation, Query, TodoModel, UpdateTodoStatusInput, UserModel, TodoStatus } from './graphql';

export const aMutation = (overrides?: Partial<Mutation>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Mutation' } & Mutation => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Mutation');
    return {
        __typename: 'Mutation',
        createTodo: overrides && overrides.hasOwnProperty('createTodo') ? overrides.createTodo! : relationshipsToOmit.has('TodoModel') ? {} as TodoModel : aTodoModel({}, relationshipsToOmit),
        createUser: overrides && overrides.hasOwnProperty('createUser') ? overrides.createUser! : relationshipsToOmit.has('UserModel') ? {} as UserModel : aUserModel({}, relationshipsToOmit),
        deleteTodo: overrides && overrides.hasOwnProperty('deleteTodo') ? overrides.deleteTodo! : relationshipsToOmit.has('TodoModel') ? {} as TodoModel : aTodoModel({}, relationshipsToOmit),
        deleteUser: overrides && overrides.hasOwnProperty('deleteUser') ? overrides.deleteUser! : relationshipsToOmit.has('UserModel') ? {} as UserModel : aUserModel({}, relationshipsToOmit),
        updateTodoContent: overrides && overrides.hasOwnProperty('updateTodoContent') ? overrides.updateTodoContent! : relationshipsToOmit.has('TodoModel') ? {} as TodoModel : aTodoModel({}, relationshipsToOmit),
        updateTodoStatus: overrides && overrides.hasOwnProperty('updateTodoStatus') ? overrides.updateTodoStatus! : relationshipsToOmit.has('TodoModel') ? {} as TodoModel : aTodoModel({}, relationshipsToOmit),
        updateUser: overrides && overrides.hasOwnProperty('updateUser') ? overrides.updateUser! : relationshipsToOmit.has('UserModel') ? {} as UserModel : aUserModel({}, relationshipsToOmit),
    };
};

export const aQuery = (overrides?: Partial<Query>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Query' } & Query => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Query');
    return {
        __typename: 'Query',
        todos: overrides && overrides.hasOwnProperty('todos') ? overrides.todos! : [relationshipsToOmit.has('TodoModel') ? {} as TodoModel : aTodoModel({}, relationshipsToOmit)],
        user: overrides && overrides.hasOwnProperty('user') ? overrides.user! : relationshipsToOmit.has('UserModel') ? {} as UserModel : aUserModel({}, relationshipsToOmit),
    };
};

export const aTodoModel = (overrides?: Partial<TodoModel>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TodoModel' } & TodoModel => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TodoModel');
    return {
        __typename: 'TodoModel',
        createdAt: overrides && overrides.hasOwnProperty('createdAt') ? overrides.createdAt! : 'voro',
        description: overrides && overrides.hasOwnProperty('description') ? overrides.description! : 'speculum',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'dolorem',
        status: overrides && overrides.hasOwnProperty('status') ? overrides.status! : TodoStatus.Completed,
        title: overrides && overrides.hasOwnProperty('title') ? overrides.title! : 'sub',
        updatedAt: overrides && overrides.hasOwnProperty('updatedAt') ? overrides.updatedAt! : 'vindico',
        userId: overrides && overrides.hasOwnProperty('userId') ? overrides.userId! : 'temporibus',
    };
};

export const anUpdateTodoStatusInput = (overrides?: Partial<UpdateTodoStatusInput>, _relationshipsToOmit: Set<string> = new Set()): UpdateTodoStatusInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('UpdateTodoStatusInput');
    return {
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'terreo',
        status: overrides && overrides.hasOwnProperty('status') ? overrides.status! : TodoStatus.Completed,
    };
};

export const aUserModel = (overrides?: Partial<UserModel>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'UserModel' } & UserModel => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('UserModel');
    return {
        __typename: 'UserModel',
        createdAt: overrides && overrides.hasOwnProperty('createdAt') ? overrides.createdAt! : 'urbs',
        firebaseUId: overrides && overrides.hasOwnProperty('firebaseUId') ? overrides.firebaseUId! : 'voluntarius',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'delinquo',
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'summopere',
        updatedAt: overrides && overrides.hasOwnProperty('updatedAt') ? overrides.updatedAt! : 'caecus',
    };
};
