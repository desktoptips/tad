/* @flow */

/*
 * main module for render process
 */

import * as styles from '../less/app.less'  // eslint-disable-line
require('../less/sidebar.less')
require('../less/columnSelector.less')
require('../less/columnList.less')
require('../less/singleColumnSelect.less')
require('../less/modal.less')

require('babel-polyfill')

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import OneRef from 'oneref'
import AppPane from './components/AppPane'
import PivotRequester from './PivotRequester'

import * as reltab from './reltab' // eslint-disable-line
import * as reltabElectron from './reltab-electron'
import * as actions from './actions'

global.cmdLineOptions = require('electron').remote.getGlobal('options')

const remoteInitMain = require('electron').remote.getGlobal('initMain')

console.log('renderMain started')

const initMainProcess = (): Promise<reltab.FileMetadata> => {
  return new Promise((resolve, reject) => {
    remoteInitMain((err, mdStr) => {
      if (err) {
        console.error('initMain error: ', err)
        reject(err)
      } else {
        console.log('initMain result: ', mdStr)
        const md = JSON.parse(mdStr)
        resolve(md)
      }
    })
  })
}

initMainProcess()
  .then(md => {
    console.log('metadata: ', md)

    const tableName = md.tableName
    const baseQuery = reltab.tableQuery(tableName)

    const rtc = reltabElectron.init()

    // module local to keep alive:
    var pivotRequester: ?PivotRequester = null  // eslint-disable-line

    actions.createAppState(rtc, md.tableName, baseQuery)
      .then(appState => {
        console.log('got initial app state: ', appState.toJS())

        const stateRef = new OneRef.Ref(appState)

        pivotRequester = new PivotRequester(stateRef) // eslint-disable-line

        ReactDOM.render(
          <OneRef.AppContainer appClass={AppPane} stateRef={stateRef} />,
          document.getElementById('app')
        )
      })
  })
  .catch(err => {
    console.error('error initializing main process: ', err)
  })
