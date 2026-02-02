type Props = {
    reference: FirebaseFirestore.DocumentReference;
    data: FirebaseFirestore.DocumentData;
    transaction?: FirebaseFirestore.Transaction;
    merge?: boolean;
}

export const setDoc = (props: Props) => {
    const { reference, data, transaction, merge } = props;

    if (transaction) {
        return transaction.set(reference, data, { merge });
    }
    return reference.set(data, { merge });
}