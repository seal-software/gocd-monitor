'use strict';

import fs from 'fs';

import * as conf from '../../app-config';
import Logger from '../utils/Logger';
import Service from './Service';


export default class SealBuildMonitorService extends Service {

    constructor() {
        super();
        this.pollingInterval = conf.goPollingInterval*1000;
        this.buildStatusFile = conf.buildStatusFile;
    }

    /**
     * Start polling seal results.json file
     */
    startPolling() {
        // Function that refreshes all pipelines
        let refreshPipelines = () => {
            fs.readFile(this.buildStatusFile, (err, data) => {
                if (err) {
                    Logger.error('Failed to read status file, retrying..');
                    // Wait a second before trying again
                    setTimeout(refreshPipelines, 1000);
                } else {
                    this.pipelines = this.sealPipelinesToPipelineResult(JSON.parse(data));
                    this.notifyAllClients('pipelines:updated', this.pipelines);
                    this.pipelineNames = this.pipelines.map(p => p.name);
                    this.notifyAllClients('pipelines:names', this.pipelineNames);
                }
            });
        };
        refreshPipelines(this.pollingInterval);
        setInterval(refreshPipelines, this.pollingInterval);
    }

    /**
     * @param   {Object}        sealPipelines       Seal pipeline result
     * @returns {Array<Object>} Pipeline instances.
     *  Example 
     * { 
     *    name : 'id,
     *    buildtime : 1457085089646,
     *    author: 'Bobby Malone',
     *    counter: 255,
     *    paused: false,
     *    health: 2,
     *    stageresults: [
     *      {
     *        name: 'Build',
     *        status: 'passed'
     *      },
     *      {
     *        name: 'Test',
     *        status: 'building'
     *      }] 
     * }
     */
    sealPipelinesToPipelineResult(sealPipelines) {
        return sealPipelines.childStatusList.filter(sp => sp.source.startsWith('pipeline')).map((sp) => {
            let pr = {
                name: sp.source.substring('pipeline'.length).trim()
            };

            // Stage results
            pr.stageresults = sp.childStatusList.map((ss) => {
                let sr = {
                    name : ss.source.substring('stage'.length).trim(),
                }
                switch (ss.statusType) {
                    case 'OK':
                        sr.status = 'passed';
                        break;
                    case 'CANCELLED':
                        sr.status = 'cancelled';
                        break;
                    case 'PENDING':
                        sr.status = 'building';
                        break;
                    case 'FAILED':
                        sr.status = 'failed';
                        break;
                    default:
                        sr.status = 'unknown';
                        break;
                }
                return sr;
            });

            // If seal pipeline is unstable, it's considered paused
            pr.paused = sp.statusType === 'UNSTABLE';

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