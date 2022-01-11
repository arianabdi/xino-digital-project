import {Injectable} from '@nestjs/common';
import axios, {AxiosRequestConfig} from "axios";
import * as cheerio from "cheerio";

@Injectable()
export class AppService {

    async getUrlHtml(url): Promise<any> {
        const config: AxiosRequestConfig = {url: url, method: 'GET'};
        const html = await axios.request(config);

        return html;
    }

    async getWhetherInDetail(offsetFromToday) {

        const url = `https://www.accuweather.com/en/ir/tehran/210841/daily-weather-forecast/210841?day=${offsetFromToday}`
        const html = await this.getUrlHtml(url);
        const $ = cheerio.load(html.data);
        const nameSelector = `html.accuweather body.daily-detail-daynight div.template-root div.two-column-page-content div.page-column-1 div.content-module div.half-day-card.content-module`;
        let output = {
            offset: offsetFromToday
        }

        /*           const data: WhetherDataModel = {
                       maxUvIndex: $(nameSelector).find('.half-day-card-content .panels .left').html()
                   }*/
        // console.log($(nameSelector).find('.half-day-card-content .panels .left').each())
        for (let item of $(nameSelector)) {
            const timeOfTheDay = $(item).find('.half-day-card-header .title').text();//day or night
            output[timeOfTheDay] = {}
            const props = $(item).find('.half-day-card-content .panels .panel-item');
            for (let prop of $(props)) {
                // output[timeOfTheDay][] = {}
                // console.log($(prop).text())
                // console.log($(prop).find('.value').text())
                output[timeOfTheDay][$(prop).first().contents().filter(function () {
                    return this.type === 'text'
                }).text().replace(/ /g, "_")] = $(prop).find('.value').text()
            }
        }
        console.log(output)
        /*for(let item of $(nameSelector).find('.half-day-card-content .panels .left .panel-item')){
            console.log($(item).text())
        }*/

        return output
    }

    async getMonthlyChange(html) {
        //monthly-component

        //Use CSS Path to Copy Element Path from Mozilla firefox
        const nameSelector = `html.accuweather body.monthly div.template-root div.two-column-page-content div.page-column-1 div.content-module div.monthly-component.non-ad .monthly-calendar a`;
        const $ = cheerio.load(html.data);


        let todayNumber = 0;
        let days = []

        $(nameSelector).each((i1, el) => {
            if ($(el).hasClass('is-today'))
                todayNumber = parseInt($(el).find('.monthly-panel-top .date').text().replace(/\s+/, ""));
        })


        for await (let el of $(nameSelector)) {
            let dayNumber = parseInt($(el).find('.monthly-panel-top .date').text().replace(/\s+/, ""))
            let low = $(el).find('.temp .low').text().replace(/(\n|\t)/gm, "");
            let high = $(el).find('.temp .high').text().replace(/(\n|\t)/gm, "");


            // console.log('dayNumber, today, low, high', `${dayNumber}, ${todayNumber}, ${low}, ${high}`);

            if (($(el).hasClass('is-past') && dayNumber < todayNumber && dayNumber >= 1) ||
                (!$(el).hasClass('is-past') && dayNumber <= 31 && dayNumber >= todayNumber)) {

                // console.log('date',$(el).find('.monthly-panel-top .date').text().replace(/\s+/, "") )

                days.push({
                    date: dayNumber,
                    low: low,
                    high: high,
                    data: !$(el).hasClass('is-past') ? await this.getWhetherInDetail((dayNumber - todayNumber) + 1) : {}
                })
            }
        }


        // console.log(`days: ${days.length}`)

        return days;
    }
}
