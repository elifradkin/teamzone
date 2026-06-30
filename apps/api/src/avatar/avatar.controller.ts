import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request, Response } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { AvatarService } from "./avatar.service";

type AuthedRequest = Request & { user: { id: string } };

interface UploadedPhoto {
  buffer: Buffer;
  mimetype: string;
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

@Controller("avatar")
@UseGuards(AuthGuard)
export class AvatarController {
  constructor(private readonly avatar: AvatarService) {}

  @Post("photo")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_PHOTO_BYTES } }))
  uploadPhoto(@Req() req: AuthedRequest, @UploadedFile() file?: UploadedPhoto) {
    if (!file) throw new BadRequestException("No file uploaded");
    if (!file.mimetype.startsWith("image/")) throw new BadRequestException("File must be an image");
    return this.avatar.savePhoto(req.user.id, file.buffer, file.mimetype);
  }

  @Get("photo")
  async getPhoto(@Req() req: AuthedRequest, @Res() res: Response) {
    const photo = await this.avatar.getPhoto(req.user.id);
    if (!photo) {
      res.status(404).end();
      return;
    }
    res.setHeader("Content-Type", photo.contentType);
    res.send(photo.data);
  }

  @Delete("photo")
  deletePhoto(@Req() req: AuthedRequest) {
    return this.avatar.deletePhoto(req.user.id);
  }
}
