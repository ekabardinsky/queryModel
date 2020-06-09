class Model {
    /// Количество каналов
    Channels = 0;

    /// Максимальная длина очереди
    MaxQueueLength = 0;

    /// Время работы СМО
    TimeToModel = 0;

    /// Шаг по времени
    dt = 0;

    /// Интенсивность получения заявок
    JobsRate = 0;

    /// Интенсивность обработки заявок
    ProcessRate = 0;

    /// Генератор СВ с заданным распределением
    Distribution = {};

    channelState = []; // Время окончания обслуживания заявки во всех каналах
    channelJobAssigned = []; // Время окончания обслуживания заявки во всех каналах
    totalProcessingTime = 0.0; // Суммарное время обслуживания заявок
    timeInQueueStat = []; // Время пребывания СМО в состояниях с очередью
    currentQueueLength = 0; // Длина очереди

    requestEntryCount = 0; // Число поступивших заявок
    declinedRequestCount = 0; // Число отказанных заявок
    acceptedRequestCount = 0; // Число обслуженных заявок
    processingTime = 0;
    cancelProcess = false;

    /// <param name="channels">Количество каналов</param>
    /// <param name="length">Максимальная длина очереди</param>
    /// <param name="time">Время работы СМО</param>
    /// <param name="_dt">Шаг по времени</param>
    /// <param name="jrate">Интенсивность получения заявок</param>
    /// <param name="prate">Интенсивность обработки заявок</param>
    /// <param name="dist">Генератор СВ с заданным распределением</param>
    constructor(channels, length, time, _dt, jRate, prate, dist) {
        this.Channels = channels;
        this.MaxQueueLength = length;
        this.TimeToModel = time;
        this.dt = _dt;
        this.JobsRate = jRate;
        this.ProcessRate = prate;
        this.Distribution = dist;
        this.cancelProcess = false;

        this.channelState = new Array(this.Channels);
        this.channelJobAssigned = new Array(this.Channels);
        this.timeInQueueStat = new Array(this.MaxQueueLength + 1);

        // init arrays
        for (let i = 0 ; i < this.channelState.length; i ++) {
            this.channelState[i] = 0;
        }
        for (let i = 0 ; i < this.channelJobAssigned.length; i ++) {
            this.channelJobAssigned[i] = 0;
        }
        for (let i = 0 ; i < this.timeInQueueStat.length; i ++) {
            this.timeInQueueStat[i] = 0;
        }
    }

    /// Проверка на получение очередной заявки
    Request() {
        let r = this.Distribution.NextDouble();
        return r < this.JobsRate;
    }

    /// Получение времени обработки очередной заявки
    GetProcessTime() {
        let r = this.Distribution.NextDouble();
        return Math.abs(r) / this.ProcessRate;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    pause() {
        this.cancelProcess = true;
    }

    resume() {
        this.cancelProcess = false;
    }

    /// Основной цикл работы СМО
    /// <param name="delay">Задержка на каждой итерации (мс)</param>
    /// <param name="progressBarsCallback">Callback для обновления UI</param>
    /// <param name="updateTextStateCallback">Callback для обновления UI</param>
    /// <param name="updateTotalProgressCallback">Callback для обновления UI</param>
    /// <returns>Полученные значения параметров в результате моделирования</returns>
    async Loop(delay, progressBarsCallback, updateTextStateCallback, updateTotalProgressCallback) {
        try {
            while (this.processingTime < this.TimeToModel)
            {

                if (this.cancelProcess) {
                    return;
                }

                this.processingTime += this.dt;
                this.timeInQueueStat[this.currentQueueLength] += this.dt;

                // update UI
                this.UpdateProgressBars(progressBarsCallback);
                this.UpdateTextBlock(updateTextStateCallback);
                this.UpdateTotalProgressBar(updateTotalProgressCallback)

                if (delay > 0) await this.sleep(delay);

                if (this.currentQueueLength > 0)
                {
                    this.timeInQueueStat[this.currentQueueLength - 1] += this.dt;
                    for (let i = 0; i < this.Channels && this.currentQueueLength > 0; i++)
                    if (this.channelState[i] <= 0)
                    {
                        this.channelState[i] = this.GetProcessTime();
                        this.channelJobAssigned[i] = this.channelState[i];
                        this.totalProcessingTime += this.channelState[i];
                        this.currentQueueLength--;
                    }
                }

                if (this.Request())
                {
                    this.requestEntryCount++;
                    if (this.currentQueueLength < this.MaxQueueLength)
                    {
                        this.acceptedRequestCount++;
                        if (this.IsThereFreeChannel) this.AssignJob();
                        else this.currentQueueLength++;
                    }
                    else this.declinedRequestCount++;
                }

                this.ProcessJobs();
            }
        } catch (e) {
            console.log(e)
        }
        return this.Statistics();
    }

    /// Проверка на наличие свободного канала
    get IsThereFreeChannel() {
        return this.channelState.filter(v => v > 0).length < this.channelState.length;
    }

    /// Выдача заявки в работу
    AssignJob() {
        for (let i = 0; i < this.Channels; i++) {
            if (this.channelState[i] <= 0) {
                this.channelState[i] = this.GetProcessTime();
                this.totalProcessingTime += this.channelState[i];
                break;
            }
        }
    }

    /// Цикл обработки задач, полученных каналами
    ProcessJobs() {
        for (let i = 0; i < this.Channels; i++) {
            if (this.channelState[i] > 0) {
                this.channelState[i] -= this.dt;
            }
        }
    }

    /// Получение параметров по запуску модели
    Statistics() {
        let parameters = {}

        let P = this.timeInQueueStat[this.timeInQueueStat.length - 1] / this.processingTime;
        parameters["Вероятность отказа в обслуживании"] = P;

        let Q = 1 - P;
        parameters["Относительная пропускная способность"] = Q;

        let A = this.JobsRate * Q;
        parameters["Абсолютная пропускная способность"] = A;

        let L0 = 0;
        for (let i = 1; i < this.timeInQueueStat.length; i++)
            L0 += i * this.timeInQueueStat[i] / this.processingTime;
        parameters["Среднее число заявок в очереди"] = L0;

        let T0 = L0 / this.JobsRate;
        parameters["Среднее время заявки в очереди"] = T0;

        let k = A / this.MaxQueueLength;
        parameters["Среднее число занятых каналов"] = T0;

        parameters["Принято заявок"] = this.acceptedRequestCount;
        parameters["Из них в очереди"] = this.currentQueueLength;
        parameters["Отклонено заявок"] = this.declinedRequestCount;
        parameters["Всего заявок"] = this.requestEntryCount;

        parameters["Процент отказов"] = Math.round(1.0 * this.declinedRequestCount / this.requestEntryCount * 100);

        parameters["Процент обработки"] = Math.round(1.0 * this.acceptedRequestCount / this.requestEntryCount * 100);

        return parameters;
    }

    UpdateProgressBars(progressBarsCallback) {
        let states = [];
        for (let i = 0; i < this.channelJobAssigned.length; i++) {
            states.push({
                Maximum: this.channelJobAssigned[i],
                Value: this.channelState[i]
            });
        }

        progressBarsCallback(states);
    }

    UpdateTextBlock(updateTextStateCallback) {
        updateTextStateCallback(this.Statistics())
    }

    UpdateTotalProgressBar(updateTotalProgressCallback) {
        updateTotalProgressCallback({
            Maximum: this.TimeToModel,
            Value: this.processingTime
        });
    }
}

window.Model = Model;