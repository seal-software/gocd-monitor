import rp from 'request-promise';

export default class SealBuildMonitorService {


    /**
     * @param   {Object}        sealPipelines       Seal pipeline result
     * @returns {Array<Object>} Pipeline instances. Example { name : 'id', status : 'passed', buildtime : 1457085089646, author: 'Bobby Malone', counter: 255}] }
     */
    static sealPipelinesToPipelineResult(sealPipelines) {
        return sealPipelines.childStatusList.filter(sp => sp.source.startsWith('pipeline')).map((sp) => {
            let pr = {
                name : sp.source.substring('pipeline'.length).trim()
            };

            // Status
            switch(sp.statusType) {
                case 'OK':
                    pr.status = 'passed';
                    break;
                case 'UNSTABLE':
                    pr.status = 'paused';
                    break;
                case 'UNKNOWN':
                    pr.status = 'building';
                    break;
                default:
                    pr.status = 'failed'
                    break;
            }

            // Build time
            pr.buildtime = sp.timeStamp;

            // Author
            pr.author = sp.triggers.reduce((p, c) => {
                if (c.user && p === 'Unknown') {
                    p = c.user.name;
                }
                return p;
            }, 'Unknown');

            return pr;
        });
    }
}