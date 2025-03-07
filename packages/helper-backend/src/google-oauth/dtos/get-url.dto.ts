import { IsArray, IsString } from 'class-validator';


export class GetOAuthURL {
  @IsArray()
  @IsString({ each: true })
  scopes: string[];

  @IsString()
  userID: string;
}
