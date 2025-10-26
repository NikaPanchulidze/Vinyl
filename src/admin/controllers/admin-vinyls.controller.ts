import {
    Body,
    Controller,
    Delete,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { VinylsService } from 'src/vinyls/vinyls.service';
import { CreateVinylDto } from 'src/vinyls/dtos/create-vinyl.dto';
import { UpdateVinylDto } from 'src/vinyls/dtos/update-vinyl.dto';
import { VinylResponseDto } from 'src/vinyls/dtos/vinyl-response.dto';
import { VinylImageResponseDto } from 'src/vinyls/dtos/vinyl-image-response.dto';
import { Role } from 'src/users/types/roles.enum';

@Controller('admin/vinyls')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Serialize(VinylResponseDto)
export class AdminVinylsController {
    constructor(private readonly vinylsService: VinylsService) {}

    @Post('/')
    @ApiOperation({ summary: 'Create a new vinyl' })
    public createVinyl(
        @Body() body: CreateVinylDto
    ): Promise<VinylResponseDto> {
        return this.vinylsService.create(body);
    }

    @Post('/:id/image')
    @UseInterceptors(FileInterceptor('image'))
    @Serialize(VinylImageResponseDto)
    @ApiOperation({ summary: 'Upload image for vinyl' })
    public async uploadImage(
        @UploadedFile() file: Express.Multer.File,
        @Param('id', new ParseUUIDPipe({ version: '4' })) id: string
    ): Promise<VinylResponseDto> {
        return this.vinylsService.uploadVinylImage(id, file);
    }

    @Patch('/:id')
    @ApiOperation({ summary: 'Update vinyl details' })
    public updateVinyl(
        @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
        @Body() body: UpdateVinylDto
    ): Promise<VinylResponseDto> {
        return this.vinylsService.update(id, body);
    }

    @Delete('/:id')
    @ApiOperation({ summary: 'Delete a vinyl' })
    public async deleteVinyl(
        @Param('id', new ParseUUIDPipe({ version: '4' })) id: string
    ): Promise<void> {
        await this.vinylsService.delete(id);
    }
}
