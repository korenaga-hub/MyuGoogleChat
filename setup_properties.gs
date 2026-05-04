// 初回セットアップ用スクリプト（1回のみ実行すること）

function setupProperties() {
  var props = PropertiesService.getScriptProperties();
  props.setProperties({
    'SPREADSHEET_ID': '1FDPAUA7imWvaGdkaOHKp2HV1ZIeqPCjXnJ0DuSgN87o'
  });
  Logger.log('PropertiesService設定完了');
  Logger.log('SPREADSHEET_ID: ' + props.getProperty('SPREADSHEET_ID'));
}

function initializeSpreadsheet() {
  var spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  var ss = SpreadsheetApp.openById(spreadsheetId);

  var groupSheet = ss.getSheetByName('全体タスク');
  if (!groupSheet) {
    groupSheet = ss.insertSheet('全体タスク');
  }
  groupSheet.getRange(1, 1, 1, 11).setValues([[
    'taskId', 'spaceId', 'spaceName', 'messageId', 'messageText',
    'registeredBy', 'registeredByName', 'status', 'createdAt', 'completedAt', 'completedBy'
  ]]);

  var personalSheet = ss.getSheetByName('個人タスク');
  if (!personalSheet) {
    personalSheet = ss.insertSheet('個人タスク');
  }
  personalSheet.getRange(1, 1, 1, 9).setValues([[
    'taskId', 'userId', 'userName', 'spaceId', 'messageId',
    'messageText', 'status', 'createdAt', 'completedAt'
  ]]);

  Logger.log('スプレッドシート初期化完了');
}

function checkProperties() {
  var props = PropertiesService.getScriptProperties();
  Logger.log('SPREADSHEET_ID: ' + props.getProperty('SPREADSHEET_ID'));
}
