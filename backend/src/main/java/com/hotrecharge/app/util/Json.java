package com.hotrecharge.app.util;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
@Component
public class Json {
    private final ObjectMapper mapper;
    public Json(ObjectMapper mapper) { this.mapper=mapper; }
    public String write(Object value) { try { return mapper.writeValueAsString(value); } catch(Exception e) { throw new IllegalStateException("Serialization failed"); } }
    public <T> T read(String value,Class<T> type) { try { return mapper.readValue(value,type); } catch(Exception e) { throw new IllegalStateException("Stored data unavailable"); } }
}
