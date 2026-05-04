// Google Chat タスク管理Bot - カードUI生成（v2形式）

function buildTaskRegisteredCard(messageText, taskId, taskType, userName) {
  var isGroup = taskType === 'group';
  var icon = isGroup ? '👥' : '👤';
  var typeLabel = isGroup ? '全体タスク' : '個人タスク';

  return {
    cardsV2: [{
      cardId: 'taskRegistered_' + taskId,
      card: {
        header: {
          title: icon + ' ' + typeLabel + 'に登録しました',
          subtitle: '登録者：' + userName
        },
        sections: [{
          widgets: [
            {
              textParagraph: {
                text: '📋 ' + messageText
              }
            },
            {
              buttonList: {
                buttons: [{
                  text: '✅ 完了にする',
                  onClick: {
                    action: {
                      function: 'completeTask',
                      parameters: [
                        { key: 'taskId', value: taskId },
                        { key: 'taskType', value: taskType }
                      ]
                    }
                  }
                }]
              }
            }
          ]
        }]
      }
    }]
  };
}

function buildCompletedCard(taskType, completedBy) {
  var isGroup = taskType === 'group';
  var icon = isGroup ? '👥' : '👤';
  var typeLabel = isGroup ? '全体タスク' : '個人タスク';

  return {
    cardsV2: [{
      cardId: 'taskCompleted',
      card: {
        header: {
          title: '✅ ' + typeLabel + '完了',
          subtitle: '完了者：' + completedBy
        },
        sections: [{
          widgets: [{
            textParagraph: {
              text: 'このタスクは完了済みです。お疲れさまでした！'
            }
          }]
        }]
      }
    }]
  };
}

function buildGroupTaskListResponse(event) {
  var spaceId = event.space.name;
  var tasks = getGroupTasks(spaceId);
  var widgets = [];

  if (tasks.length === 0) {
    widgets.push({
      textParagraph: { text: '🎉 未完了の全体タスクはありません！' }
    });
  } else {
    for (var i = 0; i < tasks.length; i++) {
      var task = tasks[i];
      var dateStr = '';
      if (task.createdAt) {
        dateStr = Utilities.formatDate(new Date(task.createdAt), 'Asia/Tokyo', 'M/d HH:mm');
      }
      widgets.push({
        decoratedText: {
          topLabel: task.registeredByName + '（' + dateStr + '）',
          text: task.messageText,
          button: {
            text: '✅ 完了',
            onClick: {
              action: {
                function: 'completeTask',
                parameters: [
                  { key: 'taskId', value: task.taskId },
                  { key: 'taskType', value: 'group' }
                ]
              }
            }
          }
        }
      });
    }
  }

  widgets.push({
    buttonList: {
      buttons: [{
        text: '🔄 更新',
        onClick: {
          action: { function: 'refreshGroupTasks' }
        }
      }]
    }
  });

  return {
    cardsV2: [{
      cardId: 'groupTaskList',
      card: {
        header: {
          title: '👥 全体タスク一覧',
          subtitle: '未完了：' + tasks.length + '件'
        },
        sections: [{ widgets: widgets }]
      }
    }]
  };
}

function buildPersonalTaskListResponse(event) {
  var userId = event.user.name;
  var spaceId = event.space.name;
  var tasks = getPersonalTasks(userId, spaceId);
  var widgets = [];

  if (tasks.length === 0) {
    widgets.push({
      textParagraph: { text: '🎉 未完了の個人タスクはありません！' }
    });
  } else {
    for (var i = 0; i < tasks.length; i++) {
      var task = tasks[i];
      var dateStr = '';
      if (task.createdAt) {
        dateStr = Utilities.formatDate(new Date(task.createdAt), 'Asia/Tokyo', 'M/d HH:mm');
      }
      widgets.push({
        decoratedText: {
          topLabel: dateStr,
          text: task.messageText,
          button: {
            text: '✅ 完了',
            onClick: {
              action: {
                function: 'completeTask',
                parameters: [
                  { key: 'taskId', value: task.taskId },
                  { key: 'taskType', value: 'personal' }
                ]
              }
            }
          }
        }
      });
    }
  }

  widgets.push({
    buttonList: {
      buttons: [{
        text: '🔄 更新',
        onClick: {
          action: { function: 'refreshPersonalTasks' }
        }
      }]
    }
  });

  return {
    cardsV2: [{
      cardId: 'personalTaskList',
      card: {
        header: {
          title: '👤 あなたの個人タスク',
          subtitle: '未完了：' + tasks.length + '件'
        },
        sections: [{ widgets: widgets }]
      }
    }]
  };
}
