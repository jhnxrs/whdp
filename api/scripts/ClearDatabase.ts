import 'reflect-metadata';
import 'dotenv/config';
import { SetupRegistry } from 'src/Common/DI/Registry';
import { Auth, Database } from 'src/Infra/Firebase/Connection';

SetupRegistry();

/**
 * Clear the entire database (documents, collections)
 * also clear Auth users
 */

const ClearDatabase = async () => {
    const rootCollections = await Database.listCollections();

    for (const col of rootCollections) {
        // Deletes everything under this collection, including nested subcollections
        await Database.recursiveDelete(col);
    }

    // delete users
    let nextPageToken: string | undefined = undefined;

    do {
        const res = await Auth.listUsers(1000, nextPageToken);
        const uids = res.users.map((u) => u.uid);

        if (uids.length) {
            const result = await Auth.deleteUsers(uids);

            if (result.failureCount > 0) {
                const errors = result.errors
                    .map((e) => `${e.index}: ${e.error?.message ?? "unknown error"}`)
                    .join(", ");
                throw new Error(`Failed to delete some users: ${errors}`);
            }
        }

        nextPageToken = res.pageToken;
    } while (nextPageToken);
}

ClearDatabase();