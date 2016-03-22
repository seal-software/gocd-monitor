'use strict';

import fs from 'fs';

import * as conf from '../../app-config';
import Service from './Service';


export default class SealBuildMonitorService extends Service {

    constructor() {
        super();
        this.pollingInterval = conf.goPollingInterval*1000;
    }

    /**
     * Start polling seal results.json file
     */
    startPolling() {
        // Function that refreshes all pipelines
        let refreshPipelines = () => {
            fs.readFile('/Users/matros/Development/projects/seal/seal-build-tools/buildmonitor/out/status.json', (err, data) => {
                if (err) {
                    throw err;
                }
                this.pipelines = this.sealPipelinesToPipelineResult(JSON.parse(data));
                this.clients.forEach((client) => {
                    client.emit('pipelines:update', this.pipelines);
                });
            });
        };
        setInterval(refreshPipelines, this.pollingInterval);
    }

    /**
     * @param   {Object}        sealPipelines       Seal pipeline result
     * @returns {Array<Object>} Pipeline instances. Example { name : 'id', status : 'passed', buildtime : 1457085089646, author: 'Bobby Malone', health: 2}] }
     */
    sealPipelinesToPipelineResult(sealPipelines) {
        return sealPipelines.childStatusList.filter(sp => sp.source.startsWith('pipeline')).map((sp) => {
            let pr = {
                name: sp.source.substring('pipeline'.length).trim()
            };

            // Status
            switch (sp.statusType) {
                case 'OK':
                    pr.status = 'passed';
                    break;
                case 'CANCELLED':
                    pr.status = 'paused';
                    break;
                case 'PENDING':
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

            // Health value from 0-5 where 0 is good 5 is bad :)
            pr.health = parseInt(sp.message.substring(sp.message.length - 1, sp.message.length).trim());

            return pr;
        });
    }
}