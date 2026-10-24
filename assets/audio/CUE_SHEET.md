# Звуки по сценам — версия 2

Идентификаторы и относительные пути указаны в manifest.json. Сначала применить aliases из manifest.json: значение null означает тишину. Начинать звук после пользовательского взаимодействия. Все сообщения имеют текстовые расшифровки.

| Сцена | Окружение и музыка | Эффекты и речь |
|---|---|---|
| Главное меню | MUS01_calm | SFX08_ui_click |
| P00 Пробуждение | AMB01_room_morning, тихая MUS01_calm | SFX01_alarm однократно, остановить при отключении |
| P01 Утренний автобус | AMB03_bus, MUS01_calm | Без звука прокрутки |
| P02 Вход в колледж | AMB04_corridor, MUS01_calm | SFX17_footsteps, затем SFX05_college_bell |
| P03 Информационный час | AMB06_classroom, MUS01_calm | SFX19_door, VO16_curator, VO17_curator, SFX02_notification |
| P04 Обратная дорога | AMB03_bus, MUS01_calm | Без звука прокрутки |
| C1_00–C1_01 Сообщение и код | AMB02_room_evening; музыку приглушить | SFX02_notification, SFX07_message_received, SFX06_message_sent |
| C1_02A После отправки кода | AMB02_room_evening | SFX11_phone_down, SFX02_notification |
| C1_02B Отказ | AMB02_room_evening | SFX03_phone_ring, VO07_anya, VO08_anya |
| C1_03 Давление | AMB02_room_evening, MUS02_tension | SFX03_phone_ring, VO13_unknown, VO14_unknown, затем тихий SFX03_phone_ring |
| C1_04A Ответить Ане | AMB02_room_evening, MUS02_tension плавно убрать | VO09_anya, VO10_anya |
| C1_04B Перевод | AMB02_room_evening, MUS02_tension | SFX06_message_sent, VO15_unknown, SFX03_phone_ring, VO11_anya, VO12_anya |
| C1_05 Помощь | AMB02_room_evening, MUS03_resolution | VO06_mother только в ветке передачи кода |
| C2_00–C2_01 Просьба о таблице | AMB04_corridor, MUS02_tension очень тихо | SFX05_college_bell однократно при входе |
| C2_02A Файл отправлен | AMB04_corridor | SFX06_message_sent |
| C2_03 Разбор | AMB06_classroom, MUS03_resolution | VO18_curator |
| C3_00–C3_01 Остановка | AMB05_bus_stop, MUS02_tension | SFX02_notification; VO01_mother только по кнопке воспроизведения |
| C3_02B Второе голосовое | AMB05_bus_stop | VO02_mother по кнопке воспроизведения |
| C3_02A После перевода | AMB05_bus_stop | SFX06_message_sent, VO03_mother |
| C3_02C Проверка звонком | AMB05_bus_stop | VO04_mother |
| C3_03 Объяснение | AMB05_bus_stop, MUS03_resolution | VO05_mother |
| C4_00–C4_02 Чат группы | AMB06_classroom, MUS02_tension | SFX07_message_received |
| C4_03A–C4_03B Публикация | AMB06_classroom, MUS02_tension | SFX06_message_sent; максимум три уведомления с паузами |
| C4_04 Исправление | AMB06_classroom, MUS03_resolution | SFX06_message_sent только при отправке опровержения |
| E00 Вечерний автобус | AMB03_bus, MUS03_resolution | Без звука прокрутки |
| E01 Дома | AMB07_kitchen, MUS03_resolution | VO19_mother, VO20_father |
| E02 Итоги | MUS03_resolution | Нейтральный SFX08_ui_click по нажатию |

## Правила сведения

- Фоновые атмосферы повторять; полные музыкальные композиции повторять с перекрытием 2 секунды. Звонки и будильник выключать по действию игрока.
- При смене локации сделать плавный переход 0,6–0,8 секунды. Не суммировать несколько копий одинакового цикла.
- Во время речи уменьшать текущую музыку до четверти её обычного усиления, окружение — до 40 процентов. Затем вернуть фон плавно.
- defaultGain в реестре — итоговая рекомендация для отдельной дорожки относительно общей громкости, а не дополнительный множитель поверх другого значения этой категории.
- Сигналы выбора одинаковы для всех ответов. Не подсказывать правильный вариант звуком до сюжетного результата.
- Кнопки паузы, отключения звука и выхода в меню останавливают активные дорожки. При продолжении речь не накладывается сама на себя.
- В главе 3 реальные и поддельные сообщения мамы намеренно используют один голос и одинаковую обработку. В интерфейсе игрока не выводить служебные названия файлов со словами «поддельное».
- Синтетическая озвучка дополняет текст. Все действия и объяснения доступны без звука.

## Лицензии и выбранные записи

Использовать титры из LICENSES.md. Основной школьный звонок имеет альтернативу SFX05B_college_bell_alternative. Речь — Microsoft Online Natural; мама настоящая и поддельная звучат с одинаковыми настройками. Звук отбоя, смены сцены, исчезновения профиля и прокрутки не требуется.
