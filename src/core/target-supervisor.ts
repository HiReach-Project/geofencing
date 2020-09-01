import { get, set } from "./helpers";
import { PutDeleteTargetSupervisor } from "../models/params/put-delete-target-supervisor";

const addSupervisor = async (params: PutDeleteTargetSupervisor) => {
    let targetSupervisors = await get("targetSupervisor", params.targetId);
    if (!targetSupervisors) {
        targetSupervisors = [params.supervisorId]
    } else {
        targetSupervisors = [...new Set([...targetSupervisors, params.supervisorId])];
    }
    await set("targetSupervisor", params.targetId, targetSupervisors);
};

const removeSupervisor = async (params: PutDeleteTargetSupervisor) => {
    let targetSupervisors = await get("targetSupervisor", params.targetId);
    if (!targetSupervisors) return;

    targetSupervisors = targetSupervisors.filter(id => id !== params.supervisorId);
    await set("targetSupervisor", params.targetId, targetSupervisors);
};

export { addSupervisor, removeSupervisor };
