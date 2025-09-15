package Feat.FeatureMe.Controller;

import java.io.File;
import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import Feat.FeatureMe.Service.S3Service;
import Feat.FeatureMe.Service.FileUploadService;



@RestController
@RequestMapping("/api/s3")
public class S3Controller
{

	@Autowired
	private S3Service s3Service;
	
	@Autowired
	private FileUploadService fileUploadService;

	//Uploads a file to AWS S3.
	@PostMapping("/upload")
	public String uploadFile(@RequestParam MultipartFile file) throws IOException
	{
		// Validate file
		fileUploadService.validateFile(file, 10, null); // 10MB limit, no type restriction
		
		//The file is saved temporarily on the server before uploading to S3.
		String keyName = fileUploadService.generateUniqueFilenameWithFolder(file, "uploads/general");
		File tempFile = File.createTempFile("temp", null);
		file.transferTo(tempFile);
		
		String s3Url = s3Service.uploadFile(keyName, tempFile.getAbsolutePath());
		
		// Clean up temp file
		tempFile.delete();
		
		return s3Url;
	}

	//Downloads a file from AWS S3 to a specific location on your computer.
	@GetMapping("/download")
	public String downloadFile(@RequestParam String keyName,
			@RequestParam String downloadPath)
	{
		s3Service.downloadFile(keyName, downloadPath);
		return "File downloaded successfully.";
	}
}