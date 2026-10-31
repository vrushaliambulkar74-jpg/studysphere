package backend;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SupabaseStorageService {

    @Value("${SUPABASE_URL:}")
    private String supabaseUrl;

    @Value("${SUPABASE_SERVICE_ROLE_KEY:}")
    private String apiKey;

    @Value("${SUPABASE_STORAGE_BUCKET:StudySphere-pdfs}")
    private String bucket;

    private final HttpClient client = HttpClient.newHttpClient();

    private String objectUrl(String filename) {
        String safeName = URLEncoder.encode(filename, StandardCharsets.UTF_8)
                .replace("+", "%20");

        return supabaseUrl.replaceAll("/+$", "")
                + "/storage/v1/object/"
                + URLEncoder.encode(bucket, StandardCharsets.UTF_8)
                + "/" + safeName;
    }

    public void upload(String filename, byte[] content) throws IOException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(objectUrl(filename)))
                .header("apikey", apiKey)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/pdf")
                .header("x-upsert", "false")
                .POST(HttpRequest.BodyPublishers.ofByteArray(content))
                .build();

        send(request);
    }

    public byte[] download(String filename) throws IOException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(objectUrl(filename)))
                .header("apikey", apiKey)
                .header("Authorization", "Bearer " + apiKey)
                .GET()
                .build();

        return send(request).body();
    }

    public void delete(String filename) throws IOException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(objectUrl(filename)))
                .header("apikey", apiKey)
                .header("Authorization", "Bearer " + apiKey)
                .DELETE()
                .build();

        send(request);
    }

    private HttpResponse<byte[]> send(HttpRequest request) throws IOException {
        try {
            HttpResponse<byte[]> response = client.send(
                    request, HttpResponse.BodyHandlers.ofByteArray());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IOException(
                        "Supabase Storage returned HTTP " + response.statusCode());
            }

            return response;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IOException("Supabase Storage request was interrupted.", exception);
        }
    }

    public boolean isConfigured() {
        return supabaseUrl != null && !supabaseUrl.isBlank()
                && apiKey != null && !apiKey.isBlank();
    }
}
