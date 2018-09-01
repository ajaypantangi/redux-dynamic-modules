import { ISagaRegistration, ISagaWithArguments, IItemManager } from "../Contracts";
import { SagaMiddleware, Task } from "redux-saga";
import { getMap } from "../Utils/ComparableMap";
import { equals as sagaEquals } from "../Utils/SagaComparer";

/**
 * Creates saga items which can be used to start and stop sagas dynamically
 */
export function getSagaManager(sagaMiddleware: SagaMiddleware<any>): IItemManager<ISagaRegistration<any>> {
    const tasks = getMap<ISagaRegistration<any>, Task>(sagaEquals);

    return {
        getItems: (): ISagaRegistration<any>[] => [...tasks.keys],
        add: (sagas: ISagaRegistration<any>[]) => {
            if (!sagas) {
                return;
            }
            sagas.forEach(saga => {
                if (saga && !tasks.get(saga)) {
                    tasks.add(saga, runSaga(sagaMiddleware, saga));
                }
            });
        },
        remove: (sagas: ISagaRegistration<any>[]) => {
            if (!sagas) {
                return;
            }
            sagas.forEach(saga => {
                if (tasks.get(saga)) {
                    const task = tasks.remove(saga);
                    task.cancel();
                }
            });
        }
    };
}

function runSaga(sagaMiddleware: SagaMiddleware<any>, sagaRegistration: ISagaRegistration<any>): Task {
    if (typeof sagaRegistration === "function") {
        const saga = sagaRegistration as () => Iterator<any>;
        return sagaMiddleware.run(saga);
    }
    const saga = (sagaRegistration as ISagaWithArguments<any>).saga;
    const argument = (sagaRegistration as ISagaWithArguments<any>).argument;
    return sagaMiddleware.run(saga, argument);
}

