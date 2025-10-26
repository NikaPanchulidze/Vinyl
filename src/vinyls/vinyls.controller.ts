import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from 'src/guards/optional-auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { VinylQueryDto } from './dtos/query-params.dto';
import { VinylResponseDto } from './dtos/vinyl-response.dto';
import { VinylsService } from './vinyls.service';
import { ApiOperation } from '@nestjs/swagger';

@Controller('vinyls')
export class VinylsController {
    constructor(private readonly vinylsService: VinylsService) {}

    @UseGuards(OptionalJwtAuthGuard)
    @Get('')
    @ApiOperation({ summary: 'Get all vinyls with optional filters' })
    public getAllVinyls(
        @Query() query: VinylQueryDto,
        @CurrentUser() user: User
    ): Promise<{
        vinyls: VinylResponseDto[];
        total: number;
        page: number;
        lastPage: number;
    }> {
        return this.vinylsService.findAll(query, user?.id);
    }
}
