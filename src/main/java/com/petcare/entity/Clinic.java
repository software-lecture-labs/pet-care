
package com.petcare.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "clinics")
public class Clinic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "district", nullable = false, length = 100)
    private String district;

    @Column(name = "address", nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(name = "latitude", precision = 10, scale = 7)
    private java.math.BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 7)
    private java.math.BigDecimal longitude;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "is_demo", nullable = false)
    private boolean demo;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    public Clinic() {
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDistrict() {
        return district;
    }

    public String getAddress() {
        return address;
    }

    public java.math.BigDecimal getLatitude() {
        return latitude;
    }

    public java.math.BigDecimal getLongitude() {
        return longitude;
    }

    public String getPhone() {
        return phone;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public boolean isDemo() {
        return demo;
    }

    public boolean isActive() {
        return active;
    }
}
