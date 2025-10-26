import {
    Body,
    Controller,
    Get,
    ParseIntPipe,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { DiscogsService } from 'src/discogs/discogs.service';
import { CreateDiscogDto } from 'src/discogs/dtos/create-discog.dto';
import { SearchDiscogDto } from 'src/discogs/dtos/search-discog.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Role } from 'src/users/types/roles.enum';
import { VinylResponseDto } from 'src/vinyls/dtos/vinyl-response.dto';

@Controller('admin/discogs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminDiscogsController {
    constructor(private readonly discogsService: DiscogsService) {}

    @Get('search')
    @ApiOperation({ summary: 'Search vinyls on Discogs' })
    public search(
        @Query() query: SearchDiscogDto
    ): Promise<VinylResponseDto[]> {
        return this.discogsService.searchVinyls(query);
    }

    @Get('details')
    @ApiOperation({ summary: 'Get vinyl details from Discogs' })
    public getDetails(
        @Query('id', ParseIntPipe) id: number
    ): Promise<VinylResponseDto> {
        return this.discogsService.getVinylDetails(
            id
        ) as Promise<VinylResponseDto>;
    }

    @Post('add-vinyl')
    @ApiOperation({ summary: 'Add a vinyl from Discogs' })
    public addVinyl(@Body() Body: CreateDiscogDto): Promise<VinylResponseDto> {
        return this.discogsService.addVinylFromDiscogs(
            Body.discogsId,
            Body.priceCents
        );
    }
}
