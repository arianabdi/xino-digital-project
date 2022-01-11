import {Controller, Get} from '@nestjs/common';
import {AppService} from './app.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {
    }

    @Get('/rino')
    async rinoDigitalScrapTest() {
        const url = 'https://www.accuweather.com/en/ir/tehran/210841/january-weather/210841';
        const html = await this.appService.getUrlHtml(url);
        return await this.appService.getMonthlyChange(html);
    }
}
