
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv'
import axios from 'axios';
dotenv.config()

const token = process.env.TOKEN

const bot = new TelegramBot(token, { polling: true });

const today = new Date();
const fiveDaysAgo = new Date(today);
fiveDaysAgo.setDate(today.getDate() - 4);

const days = [];

for (let i = 0; i < 5; i++) {
  const day = new Date(fiveDaysAgo);
  day.setDate(day.getDate() + i);
  const formattedDate = formatDate(day);
  days.push(formattedDate);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
}

let responseData;

axios.get('https://api.etradingcrm.uz/api/TgBot')
  .then(response => {
    responseData = response.data;
    doSomethingWithResponse(responseData);
  })
  .catch(error => {
    console.error(error);
  });

function doSomethingWithResponse(data) {
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (data.includes(chatId)) {
      const message = 'Assalomu aleykum, botimizga hush kelibsiz!';
    bot.sendMessage(chatId, message, {
      reply_markup: {
        keyboard: [
          ['🏁 Finished Product', '💵 Salary'],
          ['📦 Orders', '📝 Attendance']
        ],
        resize_keyboard: true
      }
    });
    } else {
      bot.sendMessage(chatId, 'Kechirasiz bu botdan foydalana olmaysiz !')
    }
  });


  bot.onText(/📝 Attendance/, (msg) => {
    const chatId = msg.chat.id;
    if (data.includes(chatId)) {
  let isAttendanceCommandHandled = false;
    if (!isAttendanceCommandHandled) {
      bot.sendMessage(chatId, '📝 Attendance', {
        reply_markup: {
          keyboard: [
            [days[4], days[3], days[2]],
            [days[1], days[0]],
            ['⬅️ ORQAGA']
          ],
          resize_keyboard: true
        }
      });
  
      isAttendanceCommandHandled = true;
    }
  } else {
    bot.sendMessage(chatId, 'Kechirasiz bu botdan foydalana olmaysiz !')
  }
  });


  bot.onText(/(\d{4}-\d{2}-\d{2})/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (data.includes(chatId)) {
    const selectedDate = match[1];
  
    try {
      const response = await axios.get('https://api.etradingcrm.uz/api/Attendance/All');
      const data = response.data;
      const filteredData = data.filter(item => item.day === selectedDate);
  
      let message = `📝 Attendance for 📅 ${selectedDate}\n\n`;
      filteredData.forEach((item, index) => {
        message += `${index + 1}. ${item.firstName} + ${item.lastName}\n`;
        message += `   🕧Late: ${item.lateHours}\n`;
        message += `   ☀️Come: ${item.isMainWork ? '✅' : '❌'}\n`;
        message += `   🕧Extra: ${item.extraWorkHours}\n\n`;
      });
  
      await bot.sendMessage(chatId, message);
    } catch (error) {
      console.error('Error retrieving attendance data:', error);
      await bot.sendMessage(chatId, 'Davomat ma’lumotlarini olishda xatolik yuz berdi.');
    }
  } else {
    bot.sendMessage(chatId, 'Kechirasiz bu botdan foydalana olmaysiz !')
  }
  }); 


  const pageSize = 10; // Sahifadagi ma'lumotlar soni

  bot.onText(/📦 Orders/, (msg) => {
    const chatId = msg.chat.id;
    if (data.includes(chatId)) {
    let currentPage = 1; // Joriy sahifa raqami
  
    axios.get('https://api.etradingcrm.uz/Api/Order/All')
    .then(response => {
      const data = response.data;
  
      // Sahifalarni hisoblash
      const totalPages = Math.ceil(data.length / pageSize);
  
      // Sahifa tartibidagi boshlang'ich va oxirgi indekslar
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = currentPage * pageSize;
      const orders = data.slice(startIndex, endIndex);
  
      let message = `Orders \n\n`;
      orders.forEach((item, index) => {
        message += `${startIndex + index + 1}. ${item.product.name}\n\n`;
        message += `    💬 Description: ${item.description}\n`;
        message += `    📊 Status: ${item.isSubmitted ? '✅' : '❌'}\n`;
        message += `    ⚖️ Amount: ${item.amount} ${item.product.category === 1 ? 'm' : item.product.category === 2 ? 'kv.m' : item.product.category === 3 ? 'kg' : 'dona'}\n`;
        message += `    💰 Price: ${item.price}\n`;
        message += `    ⌛️ Deadline: ${item.deadLine}\n\n`;
      });
  
      // Sahifa navigatsiyasi uchun inline buttonlar
      const inlineKeyboard = [
        [
          { text: '⬅️ Previous', callback_data: 'previous' },
          { text: 'Next ➡️', callback_data: 'next' }
        ]
      ];
  
      const options = {
        reply_markup: {
          inline_keyboard: inlineKeyboard
        }
      };
  
      bot.sendMessage(chatId, message, options)
        .then(sentMessage => {
          const messageId = sentMessage.message_id;
  
          // Inline buttonlarni qabul qilish
          bot.on('callback_query', (callbackQuery) => {
            const action = callbackQuery.data;
  
            if (action === 'previous' && currentPage > 1) {
              currentPage--;
            } else if (action === 'next' && currentPage < totalPages) {
              currentPage++;
            }
  
            const newStartIndex = (currentPage - 1) * pageSize;
            const newEndIndex = currentPage * pageSize;
            const newOrders = data.slice(newStartIndex, newEndIndex);
  
            let newMessage = `Orders \n\n`;
            newOrders.forEach((item, index) => {
              newMessage += `${newStartIndex + index + 1}. ${item.product.name}\n\n`;
              newMessage += `    💬 Description: ${item.description}\n`;
              newMessage += `    📊 Status: ${item.isSubmitted ? '✅' : '❌'}\n`;
              newMessage += `    ⚖️ Amount: ${item.amount} ${item.product.category === 1 ? 'm' : item.product.category === 2 ? 'kv.m' : item.product.category === 3 ? 'kg' : 'dona'}\n`;
              newMessage += `    💰 Price: ${item.price}\n`;
              newMessage += `    ⌛️ Deadline: ${item.deadLine}\n\n`;
            });
  
            // Sahifani yangilash uchun mesajni tahrirlash
            bot.editMessageText(newMessage, {
              chat_id: chatId,
              message_id: messageId,
              reply_markup: {
                inline_keyboard: inlineKeyboard
              }
            });
          });
        })
        .catch(error => {
          console.error('Error sending message:', error);
        });
    })
    .catch(error => {
      console.error('Error retrieving attendance data:', error);
      bot.sendMessage(chatId, 'Davomat ma’lumotlarini olishda xatolik yuz berdi.');
    });

  } else {
    bot.sendMessage(chatId, 'Kechirasiz bu botdan foydalana olmaysiz !')
  }
  });




  bot.onText(/🏁 Finished Product/, (msg) => {
    const chatId = msg.chat.id;
    if (data.includes(chatId)) {

    let currentPage = 1;
    axios.get('https://api.etradingcrm.uz/api/Product/All')
      .then(response => {
        const data = response.data;
    
        // Sahifalarni hisoblash
        const totalPages = Math.ceil(data.length / pageSize);
    
        // Sahifa tartibidagi boshlang'ich va oxirgi indekslar
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = currentPage * pageSize;
        const orders = data.slice(startIndex, endIndex);
    
        let message = `Finished Product \n\n`;
        orders.forEach((item, index) => {
          message += `${startIndex + index + 1}. ${item.name}\n\n`;
          message += `    💬 Description: ${item.description}\n`;
          message += `    💰 Price: ${item.price}\n`;
          message += `    ⚖️ Amount: ${item.amount}\n\n`;
        });
    
        // Sahifa navigatsiyasi uchun inline buttonlar
        const inlineKeyboard = [
          [
            { text: '⬅️ Previous', callback_data: 'previous' },
            { text: 'Next ➡️', callback_data: 'next' }
          ]
        ];
    
        const options = {
          reply_markup: {
            inline_keyboard: inlineKeyboard
          }
        };
    
        bot.sendMessage(chatId, message, options)
          .then(sentMessage => {
            const messageId = sentMessage.message_id;
    
            // Inline buttonlarni qabul qilish
            bot.on('callback_query', (callbackQuery) => {
              const action = callbackQuery.data;
    
              if (action === 'previous' && currentPage > 1) {
                currentPage--;
              } else if (action === 'next' && currentPage < totalPages) {
                currentPage++;
              }
    
              const newStartIndex = (currentPage - 1) * pageSize;
              const newEndIndex = currentPage * pageSize;
              const newOrders = data.slice(newStartIndex, newEndIndex);
    
              let newMessage = `Finished Product \n\n`;
              newOrders.forEach((item, index) => {
                newMessage += `${newStartIndex + index + 1}. ${item.name}\n\n`;
                newMessage += `    💬 Description: ${item.description}\n`;
                newMessage += `    💰 Price: ${item.price}\n`;
                newMessage += `    ⚖️ Deadline: ${item.amount}\n\n`;
              });
    
              // Sahifani yangilash uchun mesajni tahrirlash
              bot.editMessageText(newMessage, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                  inline_keyboard: inlineKeyboard
                }
              });
            });
          })
          .catch(error => {
            console.error('Error sending message:', error);
          });
      })
      .catch(error => {
        console.error('Error retrieving attendance data:', error);
        bot.sendMessage(chatId, 'Davomat ma’lumotlarini olishda xatolik yuz berdi.');
      });
    } else {
      bot.sendMessage(chatId, 'Kechirasiz bu botdan foydalana olmaysiz !')
    }
  });

  bot.onText(/💵 Salary/, (msg) => {
    const chatId = msg.chat.id;
    if (data.includes(chatId)) {

    let currentPage = 1;
    axios.get('https://api.etradingcrm.uz/api/EmployeeSalary/All')
      .then(response => {
        const data = response.data;
    
        // Sahifalarni hisoblash
        const totalPages = Math.ceil(data.length / pageSize);
    
        // Sahifa tartibidagi boshlang'ich va oxirgi indekslar
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = currentPage * pageSize;
        const orders = data.slice(startIndex, endIndex);
    
        let message = `Finished Product \n\n`;
        orders.forEach((item, index) => {
          message += `${index + 1}. ${item.employee.name} + ${item.employee.lastName}\n\n`;
        message += `    💵 Total: ${item.employee.salary} so'm\n`;
        message += `    💰 Avans: ${item.summs} so'm\n`;
        message += `    💸 Remaining: ${item.employee.salary - item.summs} so'm\n\n`;
        });
    
        // Sahifa navigatsiyasi uchun inline buttonlar
        const inlineKeyboard = [
          [
            { text: '⬅️ Previous', callback_data: 'previous' },
            { text: 'Next ➡️', callback_data: 'next' }
          ]
        ];
    
        const options = {
          reply_markup: {
            inline_keyboard: inlineKeyboard
          }
        };
    
        bot.sendMessage(chatId, message, options)
          .then(sentMessage => {
            const messageId = sentMessage.message_id;
    
            // Inline buttonlarni qabul qilish
            bot.on('callback_query', (callbackQuery) => {
              const action = callbackQuery.data;
    
              if (action === 'previous' && currentPage > 1) {
                currentPage--;
              } else if (action === 'next' && currentPage < totalPages) {
                currentPage++;
              }
    
              const newStartIndex = (currentPage - 1) * pageSize;
              const newEndIndex = currentPage * pageSize;
              const newOrders = data.slice(newStartIndex, newEndIndex);
    
              let newMessage = `Finished Product \n\n`;
              newOrders.forEach((item, index) => {
                newMessage += `${newStartIndex + index + 1}. ${item.employee.name} + ${item.employee.lastName}\n\n`;
        newMessage += `    💵 Total: ${item.employee.salary} so'm\n`;
        newMessage += `    💰 Avans: ${item.summs} so'm\n`;
        newMessage += `    💸 Remaining: ${item.employee.salary - item.summs} so'm\n\n`;
              });
    
              // Sahifani yangilash uchun mesajni tahrirlash
              bot.editMessageText(newMessage, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                  inline_keyboard: inlineKeyboard
                }
              });
            });
          })
          .catch(error => {
            console.error('Error sending message:', error);
          });
      })
      .catch(error => {
        console.error('Error retrieving attendance data:', error);
        bot.sendMessage(chatId, 'Davomat ma’lumotlarini olishda xatolik yuz berdi.');
      });
    } else {
      bot.sendMessage(chatId, 'Kechirasiz bu botdan foydalana olmaysiz !')
    }
  });

  bot.onText(/⬅️ ORQAGA/, (msg) => {
    const chatId = msg.chat.id;
    if (data.includes(chatId)) {
    bot.sendMessage(chatId, 'Orqaga', {
      reply_markup: {
        keyboard: [
          ['🏁 Finished Product', '💵 Salary'],
          ['📦 Orders', '📝 Attendance']
        ],
        resize_keyboard: true
      }
    });
  } else {
    bot.sendMessage(chatId, 'Kechirasiz bu botdan foydalana olmaysiz !')
  }
  });
}