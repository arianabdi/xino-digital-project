import {Injectable} from '@nestjs/common';
import axios, {AxiosRequestConfig} from "axios";
import * as cheerio from "cheerio";
import * as fs from 'fs';
import * as util from 'util'

const WriteFile = util.promisify(fs.writeFile);

@Injectable()
export class AppService {

    async getHtmlContentFromUrl(url): Promise<any> {
        const config: AxiosRequestConfig = {url: url, method: 'GET'};
        const html = await axios.request(config);

        return html;
    }

    async getWeatherInDetail(offsetFromToday) {

        const url = `https://www.accuweather.com/en/ir/tehran/210841/daily-weather-forecast/210841?day=${offsetFromToday}`
        const selector = `html.accuweather body.daily-detail-daynight div.template-root div.two-column-page-content div.page-column-1 div.content-module div.half-day-card.content-module`;
        const html = await this.getHtmlContentFromUrl(url);
        const $ = cheerio.load(html.data);
        let output = {
            offset: offsetFromToday
        }

        for (let item of $(selector)) {
            const timeOfTheDay = $(item).find('.half-day-card-header .title').text();//day or night
            output[timeOfTheDay] = {}
            const props = $(item).find('.half-day-card-content .panels .panel-item');
            for (let prop of $(props)) {
                output[timeOfTheDay][$(prop).first().contents().filter(function () {
                    return this.type === 'text'
                }).text().replace(/ /g, "_")] = $(prop).find('.value').text()
            }
        }
        return output
    }

    async getCurrentMonthWeatherStatus(html) {
        let todayNumber = 0;
        let days = []
        //Use CSS Path to Copy Element Path from Mozilla firefox
        const selector = `html.accuweather body.monthly div.template-root div.two-column-page-content div.page-column-1 div.content-module div.monthly-component.non-ad .monthly-calendar a`;
        const $ = cheerio.load(html.data);



        $(selector).each((i1, el) => {
            if ($(el).hasClass('is-today'))
                todayNumber = parseInt($(el).find('.monthly-panel-top .date').text().replace(/\s+/, ""));
        })


        for await (let el of $(selector)) {
            let dayNumber = parseInt($(el).find('.monthly-panel-top .date').text().replace(/\s+/, ""))
            let low = $(el).find('.temp .low').text().replace(/(\n|\t)/gm, "");
            let high = $(el).find('.temp .high').text().replace(/(\n|\t)/gm, "");

            if (($(el).hasClass('is-past') && dayNumber < todayNumber && dayNumber >= 1) ||
                (!$(el).hasClass('is-past') && dayNumber <= 31 && dayNumber >= todayNumber)) {


                days.push({
                    date: dayNumber,
                    low: low,
                    high: high,
                    data: !$(el).hasClass('is-past') ? await this.getWeatherInDetail((dayNumber - todayNumber) + 1) : {}
                })
            }
        }

        await WriteFile(process.env.OUTPUT_PATH, JSON.stringify(days))


        return days;
    }
}
